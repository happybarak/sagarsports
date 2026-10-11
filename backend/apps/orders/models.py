import uuid

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.products.models import Product, ProductVariant
from apps.users.models import Address, User


def generate_order_number():
    return f"NVR-{uuid.uuid4().hex[:10].upper()}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for Delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        ONLINE = "online", "Online Payment"
        COD = "cod", "Cash on Delivery"

    order_number = models.CharField(
        max_length=32, unique=True, default=generate_order_number, editable=False
    )
    # Nullable to support guest checkout — a guest order has no user until
    # (optionally) claimed via the post-checkout "create an account" flow.
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="orders", null=True, blank=True
    )
    guest_email = models.EmailField(blank=True)
    # Unguessable token returned once at guest order creation, used to (a)
    # let the guest view their own confirmation page without an account,
    # and (b) claim the order onto a new account if they choose to
    # register afterward. Cleared once claimed or once a user is attached.
    claim_token = models.UUIDField(null=True, blank=True, unique=True, default=None)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.ONLINE
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Cash-on-Delivery handling charge, frozen at checkout like every other
    # money field. Always 0 for online orders.
    cod_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # The address itself may later be edited or deleted by the user, so the
    # order keeps its own frozen copy of the delivery details at the point
    # of purchase. shipping_address is kept as a reference for convenience
    # (e.g. "reorder"), but every field below is what actually gets used
    # for fulfillment and is what's shown on the order.
    shipping_address = models.ForeignKey(
        Address, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    shipping_full_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=20)
    shipping_address_line_1 = models.CharField(max_length=255)
    shipping_address_line_2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["order_number"])]

    def __str__(self):
        return self.order_number


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # SET_NULL, not CASCADE: deleting a product from the catalog later must
    # never delete historical order line items.
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True
    )

    # Snapshots — frozen at checkout so price changes or product edits
    # later never rewrite what the customer actually saw and paid.
    product_name_snapshot = models.CharField(max_length=255)
    variant_label_snapshot = models.CharField(max_length=150, blank=True)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.product_name_snapshot} ({self.order.order_number})"

    @property
    def line_total(self):
        return self.price_snapshot * self.quantity
