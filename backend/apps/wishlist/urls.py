from django.urls import path

from apps.wishlist.views import WishlistItemCreateView, WishlistItemDeleteView, WishlistView

urlpatterns = [
    path("", WishlistView.as_view(), name="wishlist-detail"),
    path("items/", WishlistItemCreateView.as_view(), name="wishlist-item-create"),
    path("items/<int:pk>/", WishlistItemDeleteView.as_view(), name="wishlist-item-detail"),
]
