from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.products.models import Product, ProductVariant
from apps.products.serializers import ProductListSerializer, ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    # Read: nested product/variant detail for rendering the cart line item.
    # Write: product_id/variant_id (variant optional), validated together.
    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source="product", write_only=True
    )
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(),
        source="variant",
        write_only=True,
        required=False,
        allow_null=True,
    )
    unit_price = serializers.ReadOnlyField()
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_id",
            "variant",
            "variant_id",
            "quantity",
            "unit_price",
            "line_total",
        ]

    def validate(self, attrs):
        product = attrs.get("product") or getattr(self.instance, "product", None)
        variant = attrs.get("variant", getattr(self.instance, "variant", None))
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 1))

        if variant and product and variant.product_id != product.id:
            raise serializers.ValidationError(
                {"variant_id": "This variant does not belong to the selected product."}
            )

        available_stock = variant.stock if variant else (product.stock if product else 0)
        if quantity > available_stock:
            raise serializers.ValidationError(
                {"quantity": f"Only {available_stock} left in stock."}
            )
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.ReadOnlyField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "total_items"]

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())
