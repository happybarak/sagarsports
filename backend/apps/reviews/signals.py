from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.reviews.models import Review


def recalculate_product_rating(product):
    aggregate = product.reviews.aggregate(avg_rating=Avg("rating"), review_count=Count("id"))
    product.rating = round(aggregate["avg_rating"] or 0, 2)
    product.review_count = aggregate["review_count"] or 0
    product.save(update_fields=["rating", "review_count"])


@receiver(post_save, sender=Review)
def on_review_saved(sender, instance, **kwargs):
    recalculate_product_rating(instance.product)


@receiver(post_delete, sender=Review)
def on_review_deleted(sender, instance, **kwargs):
    recalculate_product_rating(instance.product)
