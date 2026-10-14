from rest_framework.routers import DefaultRouter

from apps.categories.views import AdminCategoryViewSet

router = DefaultRouter()
router.register("", AdminCategoryViewSet, basename="admin-category")

urlpatterns = router.urls
