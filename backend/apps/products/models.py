from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.categories.models import Category
from apps.common.models import TimeStampedModel


class Product(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    brand = models.CharField(max_length=150)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )

    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=64, unique=True)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)

    featured = models.BooleanField(default=False)
    best_seller = models.BooleanField(default=False)
    new_arrival = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.discount_price if self.discount_price else self.price

    @property
    def discount_percent(self):
        if self.discount_price and self.price > 0:
            return round((1 - (self.discount_price / self.price)) * 100)
        return 0

    @property
    def in_stock(self):
        return self.stock > 0


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.product.name} ({'primary' if self.is_primary else 'gallery'})"

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(
                pk=self.pk
            ).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductVariant(TimeStampedModel):
    class VariantType(models.TextChoices):
        COLOR = "color", "Color"
        SIZE = "size", "Size"

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    variant_type = models.CharField(max_length=20, choices=VariantType.choices)
    value = models.CharField(max_length=100)
    # Can be negative (e.g. a smaller storage option costing less than the
    # base product price), so no MinValueValidator here.
    price_delta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)
    sku_suffix = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["variant_type", "value"]
        unique_together = ["product", "variant_type", "value"]

    def __str__(self):
        return f"{self.product.name} — {self.get_variant_type_display()}: {self.value}"
