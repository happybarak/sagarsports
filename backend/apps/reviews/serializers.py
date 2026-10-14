from rest_framework import serializers

from apps.products.models import Product
from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source="product", write_only=True
    )

    class Meta:
        model = Review
        fields = [
            "id",
            "user_name",
            "is_own",
            "product_id",
            "rating",
            "title",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_name", "is_own", "created_at", "updated_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email.split("@")[0]

    def get_is_own(self, obj):
        request = self.context.get("request")
        return bool(
            request and request.user.is_authenticated and obj.user_id == request.user.id
        )
