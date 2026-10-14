from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.products.models import Product
from apps.users.models import User


class Review(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField()

    class Meta:
        unique_together = ["user", "product"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ review of {self.product.name} by {self.user.email}"
