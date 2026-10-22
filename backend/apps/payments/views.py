import json
import logging
from django.conf import settings
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.responses import success_response
from apps.orders.emails import send_order_confirmation_emails
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.payments.services import (
    create_razorpay_order,
    process_mock_payment,
    verify_razorpay_payment_signature,
    verify_razorpay_webhook_signature,
)

logger = logging.getLogger(__name__)


def get_order_for_payment_request(request, order_id):
    """
    Same access rule as OrderDetailView: the authenticated owner, or a
    guest presenting the exact claim_token they were given at order
    creation.
    """
    try:
        order = get_object_or_404(Order, id=int(order_id))
    except (TypeError, ValueError):
        raise Http404("No Order matches the given query.")
    token = request.data.get("claim_token")

    is_owner = request.user.is_authenticated and order.user_id == request.user.id
    is_valid_guest_access = (
        order.claim_token is not None and token is not None and str(order.claim_token) == token
    )

    if not (is_owner or is_valid_guest_access):
        raise Http404
    return order


class PaymentInitiateView(APIView):
    """
    POST /api/payments/initiate/  { order_id, claim_token? }
    Initiates payment for an order.
    - If COD: sets Payment as PENDING with COD transaction ID.
    - If Online: creates a Razorpay order (or mock in dev) and returns
      razorpay_order_id, key_id, amount, and customer details.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = get_order_for_payment_request(request, order_id)

        payment, _ = Payment.objects.get_or_create(
            order=order, defaults={"amount": order.total, "method": order.payment_method}
        )
        payment.amount = order.total
        payment.method = order.payment_method

        if order.payment_method == Order.PaymentMethod.COD:
            payment.transaction_id = f"COD-{order.order_number}"
            if payment.status != Payment.Status.SUCCESS:
                payment.status = Payment.Status.PENDING
            payment.save()

            return success_response(
                data={
                    "payment_id": payment.id,
                    "transaction_id": payment.transaction_id,
                    "status": payment.status,
                    "method": "cod",
                },
                message="Cash on Delivery order initiated.",
            )

        # Online payment via Razorpay (with mock fallback if keys not configured)
        try:
            rzp_data = create_razorpay_order(order)
            payment.transaction_id = rzp_data.get("order_id", "")
            payment.method = "mock" if rzp_data.get("is_mock") else "razorpay"
            payment.status = Payment.Status.PENDING
            payment.save()

            customer_email = (
                order.user.email if order.user else (order.guest_email or "")
            )

            return success_response(
                data={
                    "payment_id": payment.id,
                    "method": payment.method,
                    "status": payment.status,
                    "razorpay_order_id": rzp_data.get("order_id"),
                    "razorpay_key_id": rzp_data.get("key_id"),
                    "amount": rzp_data.get("amount"),  # in paise
                    "currency": rzp_data.get("currency", "INR"),
                    "order_number": order.order_number,
                    "customer_name": order.shipping_full_name,
                    "customer_email": customer_email,
                    "customer_phone": order.shipping_phone,
                    "is_mock": rzp_data.get("is_mock", False),
                },
                message="Payment initiated.",
            )
        except Exception as exc:
            logger.exception("Failed to initiate payment for order %s: %s", order.id, exc)
            return Response(
                {
                    "success": False,
                    "message": "Payment initiation failed. Please try again or choose Cash on Delivery.",
                    "errors": {"payment": [str(exc)]},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PaymentConfirmView(APIView):
    """
    POST /api/payments/confirm/
    Payload:
      {
        order_id,
        claim_token?,
        razorpay_payment_id?,
        razorpay_order_id?,
        razorpay_signature?
      }
    Confirms and finalizes the order:
    - For COD: marks order as CONFIRMED.
    - For Razorpay: cryptographically verifies signature, marks Payment SUCCESS, Order PAID & CONFIRMED.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = get_order_for_payment_request(request, order_id)
        payment = get_object_or_404(Payment, order=order)

        is_cod = order.payment_method == Order.PaymentMethod.COD

        if is_cod:
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["status"])
            send_order_confirmation_emails(order)
            return success_response(
                data=OrderSerializer(order, context={"request": request}).data,
                message="Order confirmed with Cash on Delivery.",
            )

        # Online payment verification
        client_order_id = request.data.get("razorpay_order_id")
        if client_order_id and client_order_id != payment.transaction_id:
            logger.warning(
                "Mismatched razorpay_order_id for order %s: expected %s, got %s",
                order.id,
                payment.transaction_id,
                client_order_id,
            )
            return Response(
                {
                    "success": False,
                    "message": "Payment verification failed. Invalid order identifier.",
                    "errors": {"razorpay_order_id": ["Order identifier mismatch."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        razorpay_order_id = payment.transaction_id
        if not razorpay_order_id:
            return Response(
                {
                    "success": False,
                    "message": "Payment has not been initiated for this order.",
                    "errors": {"payment": ["No initiated transaction found."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if payment.method == "razorpay":
            if not razorpay_payment_id or not razorpay_signature:
                return Response(
                    {
                        "success": False,
                        "message": "Missing payment verification parameters.",
                        "errors": {"payment": ["Razorpay payment details are required."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            is_valid = verify_razorpay_payment_signature(
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
            )

            if not is_valid:
                logger.error("Razorpay signature verification failed for order %s", order.id)
                payment.status = Payment.Status.FAILED
                payment.save(update_fields=["status"])
                return Response(
                    {
                        "success": False,
                        "message": "Payment verification failed. Invalid signature.",
                        "errors": {"signature": ["Cryptographic verification failed."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment.transaction_id = razorpay_payment_id
            payment.status = Payment.Status.SUCCESS
            payment.save(update_fields=["transaction_id", "status"])

            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["payment_status", "status"])
            send_order_confirmation_emails(order)

        else:
            # Mock mode only permitted in local development
            if not getattr(settings, "DEBUG", False):
                logger.error("Mock payment confirmation attempted while DEBUG is False for order %s", order.id)
                return Response(
                    {
                        "success": False,
                        "message": "Mock payment confirmation is disabled in production.",
                        "errors": {"payment": ["Unsupported payment provider."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment.status = Payment.Status.SUCCESS
            payment.save(update_fields=["status"])
            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["payment_status", "status"])
            send_order_confirmation_emails(order)

        return success_response(
            data=OrderSerializer(order, context={"request": request}).data,
            message="Payment successful and order confirmed.",
        )


@method_decorator(csrf_exempt, name="dispatch")
class RazorpayWebhookView(APIView):
    """
    POST /api/payments/razorpay/webhook/
    Asynchronous webhook called directly by Razorpay when a payment succeeds.
    Acts as a safety net in case the user closes their browser before returning.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        signature = request.headers.get("X-Razorpay-Signature", "")
        body = request.body

        if not verify_razorpay_webhook_signature(body, signature):
            logger.warning("Invalid Razorpay webhook signature received.")
            return HttpResponse("Invalid signature", status=400)

        try:
            event_data = json.loads(body.decode("utf-8"))
            event = event_data.get("event")

            if event in ("payment.captured", "order.paid"):
                payment_entity = (
                    event_data.get("payload", {}).get("payment", {}).get("entity", {})
                )
                order_id_rzp = payment_entity.get("order_id")
                payment_id_rzp = payment_entity.get("id")

                if order_id_rzp:
                    payment = Payment.objects.filter(transaction_id=order_id_rzp).first()
                    if payment and payment.status != Payment.Status.SUCCESS:
                        payment.transaction_id = payment_id_rzp or order_id_rzp
                        payment.status = Payment.Status.SUCCESS
                        payment.save(update_fields=["transaction_id", "status"])

                        order = payment.order
                        order.payment_status = Order.PaymentStatus.PAID
                        order.status = Order.Status.CONFIRMED
                        order.save(update_fields=["payment_status", "status"])
                        send_order_confirmation_emails(order)
                        logger.info("Order %s marked PAID via Razorpay webhook.", order.id)

            return HttpResponse("OK", status=200)
        except Exception as exc:
            logger.exception("Error processing Razorpay webhook: %s", exc)
            return HttpResponse("Error processing event", status=500)
