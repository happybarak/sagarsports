from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model adding created_at / updated_at to any model that
    inherits from it. Every model across every app (Product, Order, Address,
    Review, etc.) extends this instead of redeclaring the same two fields.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
