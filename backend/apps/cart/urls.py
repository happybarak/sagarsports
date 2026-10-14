from django.urls import path

from apps.cart.views import (
    CartClearView,
    CartItemCreateView,
    CartItemDetailView,
    CartSyncView,
    CartView,
)

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("sync/", CartSyncView.as_view(), name="cart-sync"),
    path("clear/", CartClearView.as_view(), name="cart-clear"),
]
