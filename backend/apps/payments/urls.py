from django.urls import path

from apps.payments.views import PaymentConfirmView, PaymentInitiateView

urlpatterns = [
    path("initiate/", PaymentInitiateView.as_view(), name="payment-initiate"),
    path("confirm/", PaymentConfirmView.as_view(), name="payment-confirm"),
]
