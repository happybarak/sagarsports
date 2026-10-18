from django.urls import path

from apps.payments.views import (
    PaymentConfirmView,
    PaymentInitiateView,
    RazorpayWebhookView,
)

urlpatterns = [
    path("initiate/", PaymentInitiateView.as_view(), name="payment-initiate"),
    path("confirm/", PaymentConfirmView.as_view(), name="payment-confirm"),
    path("razorpay/webhook/", RazorpayWebhookView.as_view(), name="payment-razorpay-webhook"),
]
