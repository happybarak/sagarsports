from django.db.models import Count, DecimalField, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce, NullIf
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.categories.models import Category
from apps.orders.models import OrderItem
from apps.products.description_generator import generate_product_description
from apps.products.filters import ProductFilter
from apps.products.models import Product, ProductImage
from apps.products.search_utils import expand_search_terms
from apps.products.serializers import (
    AdminProductSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer


class SellingPriceOrderingFilter(OrderingFilter):
    """
    The API keeps accepting ?ordering=price / -price, but sorts by the price
    the customer actually pays (discount price when set) rather than the
    list price, so "Price: Low to High" matches the prices shown on screen.
    """

    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        aliases = {"price": "selling_price", "-price": "-selling_price"}
        return [aliases.get(field, field) for field in ordering] if ordering else ordering


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    Supports ?featured=true, ?best_seller=true, ?new_arrival=true,
    ?category=<slug> (includes descendant categories), ?brand=<name>,
    ?min_price=, ?max_price=, ?min_rating=, ?in_stock=true, ?ordering=,
    plus ?search= — handled manually here (not DRF's SearchFilter) so it
    can expand known synonyms (see search_utils.expand_search_terms):
    searching "notebook" also matches products only described as
    "laptop", without any ML model or external API call.
    """

    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, SellingPriceOrderingFilter]
    ordering_fields = ["price", "rating", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        primary_image_subquery = Subquery(
            ProductImage.objects.filter(product=OuterRef("pk"))
            .order_by("-is_primary", "order", "id")
            .values("image")[:1]
        )
        queryset = (
            Product.objects.filter(is_active=True)
            .annotate(
                primary_image_file=primary_image_subquery,
                selling_price=Coalesce(
                    NullIf("discount_price", Value(0), output_field=DecimalField()),
                    "price",
                    output_field=DecimalField(),
                ),
            )
            .defer("description")
        )

        search_term = self.request.query_params.get("search")
        if search_term:
            terms = expand_search_terms(search_term)
            query = Q()
            for term in terms:
                query |= (
                    Q(name__icontains=term)
                    | Q(description__icontains=term)
                    | Q(brand__icontains=term)
                )
            queryset = queryset.filter(query).distinct()

        return queryset


class ProductSuggestionsView(APIView):
    """
    GET /api/products/suggestions/?q=<partial query>
    Fast, lean autocomplete for the header search bar — a handful of
    matches with just enough detail to render a dropdown, not a full
    paginated listing. Names starting with the query are ranked above
    names that merely contain it. Same synonym expansion as the main
    search, so typing "earbuds" surfaces headphones as you type, not only
    after pressing Enter.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response([])

        terms = expand_search_terms(query)
        match_query = Q()
        for term in terms:
            match_query |= Q(name__icontains=term) | Q(brand__icontains=term)

        products = (
            Product.objects.filter(is_active=True)
            .filter(match_query)
            .prefetch_related("images")
            .distinct()
        )
        # Prioritize name-prefix matches, then alphabetical — ranked in
        # Python since sorting by a boolean annotate isn't portable across
        # DB backends.
        ranked = sorted(
            products[:40],
            key=lambda p: (not p.name.lower().startswith(query.lower()), p.name),
        )[:8]

        serializer = ProductListSerializer(ranked, many=True, context={"request": request})
        return Response(serializer.data)


class ProductBrandListView(APIView):
    """
    GET /api/products/brands/
    Distinct, sorted brand names among active products — powers the
    listing page's brand-filter checkboxes without the frontend having to
    derive it from a full product list.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        brands = (
            Product.objects.filter(is_active=True)
            .exclude(brand="")
            .order_by("brand")
            .values_list("brand", flat=True)
            .distinct()
        )
        return Response(list(brands))


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/:slug/
    Full product detail — description, all images, all variants,
    category reference. Used by the product detail page (Phase 8).
    """

    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images", "variants")
        )


class ProductRelatedView(APIView):
    """
    GET /api/products/:slug/related/
    Other active products in the same category, excluding this one,
    capped at 8 — feeds the "related products" section on the detail page.
    """

    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.select_related("category"), slug=slug, is_active=True
        )
        related = (
            Product.objects.filter(category=product.category, is_active=True)
            .exclude(pk=product.pk)
            .prefetch_related("images")[:8]
        )
        serializer = ProductListSerializer(related, many=True, context={"request": request})
        return Response(serializer.data)


class ProductFrequentlyBoughtTogetherView(APIView):
    """
    GET /api/products/:slug/frequently-bought-together/
    Products actually co-purchased with this one, ranked by how many
    distinct *paid* orders contained both — a real recommendation signal,
    unlike the same-category "related products" above. Falls back to
    same-category products when there's no order history yet for this
    product (cold start — a brand-new product, or a fresh database with
    no sales), so the section is never just empty on day one.
    """

    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.select_related("category"), slug=slug, is_active=True
        )

        order_ids = OrderItem.objects.filter(
            product=product, order__payment_status="paid"
        ).values_list("order_id", flat=True)

        co_occurring = (
            OrderItem.objects.filter(order_id__in=order_ids)
            .exclude(product=product)
            .filter(product__isnull=False, product__is_active=True)
            .values("product_id")
            .annotate(co_count=Count("order_id", distinct=True))
            .order_by("-co_count")[:8]
        )
        ranked_ids = [row["product_id"] for row in co_occurring]

        if ranked_ids:
            products = (
                Product.objects.filter(id__in=ranked_ids, is_active=True)
                .prefetch_related("images")
            )
            products_by_id = {p.id: p for p in products}
            # Rebuild order so the most-frequently-co-purchased product comes first.
            results = [products_by_id[pid] for pid in ranked_ids if pid in products_by_id]
            is_fallback = False
        else:
            results = list(
                Product.objects.filter(category=product.category, is_active=True)
                .exclude(pk=product.pk)
                .prefetch_related("images")[:8]
            )
            is_fallback = True

        serializer = ProductListSerializer(results, many=True, context={"request": request})
        return Response({"results": serializer.data, "is_fallback": is_fallback})


class ProductReviewListView(generics.ListAPIView):
    """
    GET /api/products/:slug/reviews/
    Paginated reviews for one product, newest first. Public read — writes
    (create/edit/delete) go through the flat /api/reviews/ endpoints
    (apps.reviews), which require the reviewer to own the review.
    """

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Review.objects.filter(product__slug=self.kwargs["slug"]).select_related("user")


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Full CRUD at /api/admin/products/, staff-only. Supports multipart
    requests so a primary image file can be uploaded alongside the other
    fields on create/update.
    """

    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["category", "is_active", "featured"]
    search_fields = ["name", "sku", "brand"]

    def get_queryset(self):
        return (
            Product.objects.all()
            .select_related("category")
            .prefetch_related("images")
            .order_by("-created_at")
        )


class AdminGenerateDescriptionView(APIView):
    """
    POST /api/admin/products/generate-description/  { name, brand, category }
    Rule-based (template) description generator for the admin product
    form's "Auto-generate" button — explicitly not a real AI/LLM call, by
    design. See apps.products.description_generator for the templates.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        name = request.data.get("name", "").strip()
        brand = request.data.get("brand", "").strip()
        category_id = request.data.get("category")

        if not name:
            return Response(
                {
                    "success": False,
                    "message": "Product name is required to generate a description.",
                    "errors": {"name": "This field is required."},
                },
                status=400,
            )

        category_name = ""
        if category_id:
            category = Category.objects.filter(id=category_id).first()
            category_name = category.name if category else ""

        description = generate_product_description(name, brand, category_name)
        return Response({"description": description})
