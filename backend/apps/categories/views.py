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

    def list(self, request, *args, **kwargs):
        # Fetch all active categories in a SINGLE database query and assemble tree in memory
        all_categories = list(Category.objects.filter(is_active=True).order_by("name"))

        children_map = {cat.id: [] for cat in all_categories}
        for cat in all_categories:
            cat.prefetched_children = children_map[cat.id]

        roots = []
        for cat in all_categories:
            if cat.parent_id is None:
                roots.append(cat)
            elif cat.parent_id in children_map:
                children_map[cat.parent_id].append(cat)

        serializer = self.get_serializer(roots, many=True)
        return Response(serializer.data)


class CategoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/categories/:slug/
    Used by the category landing page (Phase 7) to resolve a slug from the
    URL into a category (and its children, for further filtering).
    """

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_object(self):
        slug = self.kwargs.get(self.lookup_field)
        # Fetch all active categories in 1 query so the tree is built in memory without N+1
        all_categories = list(Category.objects.filter(is_active=True).order_by("name"))
        children_map = {cat.id: [] for cat in all_categories}
        for cat in all_categories:
            cat.prefetched_children = children_map[cat.id]

        for cat in all_categories:
            if cat.parent_id in children_map:
                children_map[cat.parent_id].append(cat)

        target_obj = None
        slug_lower = slug.lower() if slug else ""
        slug_space = slug_lower.replace("-", " ") if slug else ""

        for cat in all_categories:
            c_slug = cat.slug.lower() if cat.slug else ""
            c_name = cat.name.lower() if cat.name else ""
            if c_slug == slug_lower:
                target_obj = cat
                break
            if not target_obj and (c_name == slug_lower or c_name == slug_space):
                target_obj = cat

        if not target_obj:
            from rest_framework.exceptions import NotFound
            raise NotFound("Category not found.")
        return target_obj


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
