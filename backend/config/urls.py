from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.orders.views import AdminAnalyticsDetailView, AdminDashboardSummaryView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.common.urls")),
    path("api/auth/", include("apps.users.auth_urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/users/addresses/", include("apps.users.address_urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    # Admin-only endpoints (all staff-gated via IsAdminUser)
    path("api/admin/products/", include("apps.products.admin_urls")),
    path("api/admin/categories/", include("apps.categories.admin_urls")),
    path("api/admin/orders/", include("apps.orders.admin_urls")),
    path("api/admin/users/", include("apps.users.admin_urls")),
    path(
        "api/admin/analytics/summary/",
        AdminDashboardSummaryView.as_view(),
        name="admin-dashboard-summary",
    ),
    path(
        "api/admin/analytics/detailed/",
        AdminAnalyticsDetailView.as_view(),
        name="admin-analytics-detailed",
    ),
]

if settings.DEBUG and settings.MEDIA_URL.startswith("/"):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
