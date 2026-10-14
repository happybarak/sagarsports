from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.responses import success_response
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.payments.models import Payment
from apps.payments.services import process_mock_payment


def get_order_for_payment_request(request, order_id):
    """
    Same access rule as OrderDetailView: the authenticated owner, or a
    guest presenting the exact claim_token they were given at order
    creation. Payments need this too — guest checkout has no account to
    authenticate, so IsAuthenticated alone would lock guests out of
    paying for their own order.
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
    claim_token is required for guest orders, ignored (not needed) for an
    authenticated owner's own order. Creates (or reuses) the Payment
    record and runs it through the mock gateway. Doesn't change the
    order's status itself — that only happens on confirm, matching a real
    gateway's initiate-then-webhook-confirms flow.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = get_order_for_payment_request(request, order_id)

        payment, _ = Payment.objects.get_or_create(
            order=order, defaults={"amount": order.total, "method": order.payment_method}
        )
        # Always mirror the order's authoritative total/method, even on re-initiate.
        payment.amount = order.total
        payment.method = order.payment_method

        if order.payment_method == Order.PaymentMethod.COD:
            # Nothing to charge online; cash is collected on delivery.
            payment.transaction_id = f"COD-{order.order_number}"
            if payment.status != Payment.Status.SUCCESS:  # never un-pay a delivered COD order
                payment.status = Payment.Status.PENDING
        else:
            success, transaction_id = process_mock_payment(order.total)
            payment.transaction_id = transaction_id
            payment.status = Payment.Status.SUCCESS if success else Payment.Status.FAILED
        payment.save()

        return success_response(
            data={
                "payment_id": payment.id,
                "transaction_id": payment.transaction_id,
                "status": payment.status,
            },
            message="Payment initiated.",
        )


class PaymentConfirmView(APIView):
    """
    POST /api/payments/confirm/  { order_id, claim_token? }
    Finalizes a successful payment: sets Order.payment_status=paid and
    Order.status=confirmed. Refuses to confirm a payment that wasn't
    successful, or an order that has no payment record yet.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = get_order_for_payment_request(request, order_id)
        payment = get_object_or_404(Payment, order=order)

        is_cod = order.payment_method == Order.PaymentMethod.COD
        # Online orders need a successful payment; for COD, placing the order
        # is the confirmation and payment is collected on delivery.
        if not is_cod and payment.status != Payment.Status.SUCCESS:
            return Response(
                {
                    "success": False,
                    "message": "Payment was not successful — cannot confirm this order.",
                    "errors": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_cod:
            order.payment_status = Order.PaymentStatus.PAID
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["payment_status", "status"])

        return success_response(
            data=OrderSerializer(order, context={"request": request}).data,
            message="Order confirmed.",
        )
