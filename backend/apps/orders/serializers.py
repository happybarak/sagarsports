from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.ReadOnlyField()
    product_slug = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_slug",
            "product_image",
            "product_name_snapshot",
            "variant_label_snapshot",
            "price_snapshot",
            "quantity",
            "line_total",
        ]

    def get_product_slug(self, obj):
        # Product may have been deleted since the order was placed
        # (OrderItem.product is SET_NULL) — the snapshot fields above are
        # what's actually authoritative for display either way.
        return obj.product.slug if obj.product else None

    def get_product_image(self, obj):
        if not obj.product:
            return None
        image = next((img for img in obj.product.images.all() if img.is_primary), None)
        if image is None:
            image = obj.product.images.first()
        if image is None:
            return None
        request = self.context.get("request")
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "payment_method",
            "subtotal",
            "discount",
            "shipping_cost",
            "tax",
            "cod_fee",
            "total",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address_line_1",
            "shipping_address_line_2",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "items",
            "created_at",
        ]


class AdminOrderListSerializer(serializers.ModelSerializer):
    """Lean list representation for the admin orders table."""

    user_email = serializers.CharField(source="user.email", read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user_email",
            "status",
            "payment_status",
            "payment_method",
            "total",
            "item_count",
            "created_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class AdminOrderDetailSerializer(OrderSerializer):
    """Same fields as the customer-facing OrderSerializer, plus who placed it."""

    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ["user_email"]


class AdminOrderStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Deliberately narrow: admins can change an order's status, nothing
    else. Totals, addresses, and line items are snapshots from checkout —
    letting them be edited here would corrupt the historical record.
    """

    class Meta:
        model = Order
        fields = ["status"]

    def validate_status(self, value):
        # Stock is returned when an order is cancelled and is not re-reserved,
        # so reviving a cancelled order would leave inventory wrong.
        if self.instance and self.instance.status == Order.Status.CANCELLED and value != Order.Status.CANCELLED:
            raise serializers.ValidationError("A cancelled order cannot be reopened.")
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        was_cancelled = instance.status == Order.Status.CANCELLED
        instance = super().update(instance, validated_data)
        if instance.status == Order.Status.CANCELLED and not was_cancelled:
            restock_order_items(instance)
        # A COD order is only really paid when the courier collects the cash.
        # Without this it would stay "pending" forever and be invisible to
        # everything keyed on payment_status == "paid" (revenue analytics,
        # frequently-bought-together, verified purchases).
        if (
            instance.status == Order.Status.DELIVERED
            and instance.payment_method == Order.PaymentMethod.COD
            and instance.payment_status == Order.PaymentStatus.PENDING
        ):
            instance.payment_status = Order.PaymentStatus.PAID
            instance.save(update_fields=["payment_status"])
            payment = getattr(instance, "payment", None)
            if payment is not None:
                payment.status = "success"
                payment.save(update_fields=["status"])
        return instance


def restock_order_items(order):
    """Return an order's quantities to stock (call inside a transaction)."""
    for item in order.items.select_related("product", "variant"):
        if item.variant:
            item.variant.stock = F("stock") + item.quantity
            item.variant.save(update_fields=["stock"])
        elif item.product:
            item.product.stock = F("stock") + item.quantity
            item.product.save(update_fields=["stock"])
