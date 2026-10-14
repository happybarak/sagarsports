from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.products.views import AdminGenerateDescriptionView, AdminProductViewSet

router = DefaultRouter()
router.register("", AdminProductViewSet, basename="admin-product")

urlpatterns = [
    path(
        "generate-description/",
        AdminGenerateDescriptionView.as_view(),
        name="admin-generate-description",
    ),
] + router.urls
