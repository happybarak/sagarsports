from django.db import models

from apps.common.models import TimeStampedModel
from apps.orders.models import Order


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")
    method = models.CharField(max_length=20, default="mock")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_id = models.CharField(max_length=64, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Payment for {self.order.order_number} ({self.status})"
