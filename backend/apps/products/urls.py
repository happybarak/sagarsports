from django.urls import path

from apps.products.views import (
    ProductBrandListView,
    ProductDetailView,
    ProductFrequentlyBoughtTogetherView,
    ProductListView,
    ProductRelatedView,
    ProductReviewListView,
    ProductSuggestionsView,
)

urlpatterns = [
    path("brands/", ProductBrandListView.as_view(), name="product-brands"),
    path("suggestions/", ProductSuggestionsView.as_view(), name="product-suggestions"),
    path("", ProductListView.as_view(), name="product-list"),
    path("<slug:slug>/related/", ProductRelatedView.as_view(), name="product-related"),
    path(
        "<slug:slug>/frequently-bought-together/",
        ProductFrequentlyBoughtTogetherView.as_view(),
        name="product-frequently-bought-together",
    ),
    path("<slug:slug>/reviews/", ProductReviewListView.as_view(), name="product-reviews"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
]
