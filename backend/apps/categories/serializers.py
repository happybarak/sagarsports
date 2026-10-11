from rest_framework import serializers

from apps.categories.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Recursive: each category includes its active children, which each
    include their own children, etc. The mega-menu renders straight off
    this without any extra frontend-side tree-building.
    """

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "children"]

    def get_children(self, obj):
        active_children = obj.children.filter(is_active=True)
        return CategorySerializer(active_children, many=True, context=self.context).data


class AdminCategorySerializer(serializers.ModelSerializer):
    """
    Flat (non-recursive) CRUD serializer for /api/admin/categories/ —
    the admin table shows parent as a plain reference, not a nested tree.
    """

    parent_name = serializers.CharField(source="parent.name", read_only=True, default=None)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "parent_name", "is_active"]
        read_only_fields = ["id", "slug"]
