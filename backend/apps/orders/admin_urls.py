from django.urls import path

from apps.orders.views import AdminOrderDetailView, AdminOrderListView

urlpatterns = [
    path("", AdminOrderListView.as_view(), name="admin-order-list"),
    path("<int:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
]
