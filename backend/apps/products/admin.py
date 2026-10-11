from django.contrib import admin

from apps.products.models import Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category",
        "brand",
        "price",
        "discount_price",
        "stock",
        "is_active",
        "featured",
    ]
    list_filter = ["category", "brand", "is_active", "featured", "best_seller", "new_arrival"]
    search_fields = ["name", "sku", "brand"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
