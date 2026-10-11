from django.urls import path

from apps.reviews.views import ReviewCreateView, ReviewUpdateDeleteView

urlpatterns = [
    path("", ReviewCreateView.as_view(), name="review-create"),
    path("<int:pk>/", ReviewUpdateDeleteView.as_view(), name="review-update-delete"),
]
