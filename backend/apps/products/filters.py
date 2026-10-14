import django_filters

from apps.categories.models import Category
from apps.products.models import Product


class ProductFilter(django_filters.FilterSet):
    # Filtering by a parent category slug (e.g. "computers") includes
    # products in its children too (e.g. "laptops", "desktops") — so the
    # category landing page shows everything under that branch, not just
    # products assigned directly to the parent.
    category = django_filters.CharFilter(method="filter_category")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="iexact")
    # Price filters apply to the price the customer actually pays (discount
    # price when set, else list price) — `selling_price` is annotated in
    # ProductListView.get_queryset.
    min_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="selling_price", lookup_expr="lte")
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["featured", "best_seller", "new_arrival", "category", "brand"]

    def filter_category(self, queryset, name, value):
        try:
            category = Category.objects.get(slug=value)
        except Category.DoesNotExist:
            return queryset.none()

        slugs = [category.slug] + list(
            category.children.filter(is_active=True).values_list("slug", flat=True)
        )
        return queryset.filter(category__slug__in=slugs)

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)
