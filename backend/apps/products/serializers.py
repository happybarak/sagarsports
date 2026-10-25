from rest_framework import serializers

from apps.products.models import Product, ProductImage, ProductVariant

# Below this many units a product is "low stock" (admin dashboard and the
# storefront "Only N left" indicator share this value).
LOW_STOCK_THRESHOLD = 5


def is_storefront_low_stock(stock):
    """In stock but running low — out of stock is not 'low'."""
    return 0 < stock < LOW_STOCK_THRESHOLD


class ProductListSerializer(serializers.ModelSerializer):
    """
    Lean representation for list views (homepage sections, product grid).
    The full detail serializer with images/variants/description is below.
    """

    primary_image = serializers.SerializerMethodField()
    effective_price = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    low_stock = serializers.SerializerMethodField()

    def get_low_stock(self, obj):
        return is_storefront_low_stock(obj.stock)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "brand",
            "price",
            "discount_price",
            "effective_price",
            "discount_percent",
            "rating",
            "review_count",
            "stock",
            "in_stock",
            "low_stock",
            "primary_image",
        ]

    def get_primary_image(self, obj):
        image_file = getattr(obj, "primary_image_file", None)
        if image_file:
            request = self.context.get("request")
            url = ProductImage.image.field.storage.url(image_file)
            return request.build_absolute_uri(url) if request else url

        image = next((img for img in obj.images.all() if img.is_primary), None)
        if image is None:
            images = list(obj.images.all())
            image = images[0] if images else None
        if image is None:
            return None
        request = self.context.get("request")
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]

    def get_image(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class ProductVariantSerializer(serializers.ModelSerializer):
    variant_type_display = serializers.CharField(
        source="get_variant_type_display", read_only=True
    )

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "variant_type",
            "variant_type_display",
            "value",
            "price_delta",
            "stock",
            "sku_suffix",
        ]


class ProductCategorySerializer(serializers.Serializer):
    """Minimal category reference embedded in product detail — just enough
    for a breadcrumb link, not the full nested tree."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()


class ProductDetailSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    effective_price = serializers.ReadOnlyField()
    discount_percent = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    low_stock = serializers.SerializerMethodField()

    def get_low_stock(self, obj):
        return is_storefront_low_stock(obj.stock)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "brand",
            "category",
            "price",
            "discount_price",
            "effective_price",
            "discount_percent",
            "stock",
            "sku",
            "rating",
            "review_count",
            "in_stock",
            "low_stock",
            "images",
            "variants",
        ]



class AdminProductSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for /api/admin/products/. Separate from
    ProductDetailSerializer because it exposes admin-only fields
    (is_active, stock as writable, category as a writable id) and accepts
    an optional primary-image file upload — the storefront-facing
    serializers never expose writes.
    """

    category_name = serializers.CharField(source="category.name", read_only=True)
    # DRF doesn't reliably inherit a True model default for BooleanField —
    # declared explicitly so a product created without this field ends up
    # active, matching Product.is_active's actual model default.
    is_active = serializers.BooleanField(default=True)
    primary_image = serializers.SerializerMethodField(read_only=True)
    primary_image_upload = serializers.ImageField(write_only=True, required=False)
    low_stock = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "brand",
            "category",
            "category_name",
            "price",
            "discount_price",
            "stock",
            "sku",
            "featured",
            "best_seller",
            "new_arrival",
            "is_active",
            "rating",
            "review_count",
            "primary_image",
            "primary_image_upload",
            "low_stock",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "rating", "review_count", "created_at"]

    def get_primary_image(self, obj):
        images = list(obj.images.all())
        image = next((img for img in images if img.is_primary), None) or (images[0] if images else None)
        if image is None:
            return None
        request = self.context.get("request")
        url = image.image.url
        return request.build_absolute_uri(url) if request else url

    def get_low_stock(self, obj):
        return obj.stock < LOW_STOCK_THRESHOLD

    def create(self, validated_data):
        image_file = validated_data.pop("primary_image_upload", None)
        product = super().create(validated_data)
        if image_file:
            ProductImage.objects.create(
                product=product, image=image_file, is_primary=True, alt_text=product.name
            )
        return product

    def update(self, instance, validated_data):
        image_file = validated_data.pop("primary_image_upload", None)
        product = super().update(instance, validated_data)
        if image_file:
            # Replace the existing primary image rather than stacking a
            # second one — this UI only manages a single hero image.
            ProductImage.objects.filter(product=product, is_primary=True).update(
                is_primary=False
            )
            ProductImage.objects.create(
                product=product, image=image_file, is_primary=True, alt_text=product.name
            )
        return product
