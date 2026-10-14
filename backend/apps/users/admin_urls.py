from django.urls import path

from apps.users.views import AdminUserListView

urlpatterns = [
    path("", AdminUserListView.as_view(), name="admin-user-list"),
]
