from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser

from apps.categories.models import Category
from apps.categories.serializers import AdminCategorySerializer, CategorySerializer


class CategoryListView(generics.ListAPIView):
    """
    GET /api/categories/
    Returns only root categories (parent=None); each includes its nested
    active children via CategorySerializer. This one response is enough to
    render the entire mega-menu.
    """

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None  # the full tree is small — no need to paginate it

    def get_queryset(self):
        return Category.objects.filter(parent__isnull=True, is_active=True)


class CategoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/categories/:slug/
    Used by the category landing page (Phase 7) to resolve a slug from the
    URL into a category (and its children, for further filtering).
    """

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    queryset = Category.objects.filter(is_active=True)


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Full CRUD at /api/admin/categories/, staff-only."""

    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    queryset = Category.objects.all().select_related("parent").order_by("name")

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "message": "This category still has products or subcategories. Move or remove them first.",
                    "errors": {},
                },
                status=status.HTTP_409_CONFLICT,
            )
