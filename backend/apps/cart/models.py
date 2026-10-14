from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.products.models import Product, ProductVariant
from apps.users.models import User


class Cart(TimeStampedModel):
    """
    One server-side cart per logged-in user. Guests use browser
    localStorage instead (see frontend cartSlice, Phase 9) — nothing is
    written here until the guest logs in and the frontend calls
    /api/cart/sync/.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")

    def __str__(self):
        return f"Cart for {self.user.email}"

    @property
    def subtotal(self):
        return sum((item.line_total for item in self.items.all()), start=0)


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        unique_together = ["cart", "product", "variant"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.quantity} x {self.product.name} ({self.cart.user.email})"

    @property
    def unit_price(self):
        price = self.product.effective_price
        if self.variant:
            price += self.variant.price_delta
        return price

    @property
    def line_total(self):
        return self.unit_price * self.quantity
