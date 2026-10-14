from django.db import models

from apps.common.models import TimeStampedModel
from apps.products.models import Product
from apps.users.models import User


class Wishlist(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wishlist")

    def __str__(self):
        return f"Wishlist for {self.user.email}"


class WishlistItem(TimeStampedModel):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        unique_together = ["wishlist", "product"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.email}'s wishlist"
