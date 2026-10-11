import uuid


def process_mock_payment(amount):
    """
    Stand-in for a real payment gateway call. Always succeeds — this is a
    mock, not a fraud/decline simulator. To integrate Razorpay/Stripe
    later, this is the one function that changes: keep the same
    signature (amount in) -> (success: bool, transaction_id: str), swap
    the body for the real SDK call, and PaymentInitiateView/PaymentConfirmView
    in views.py don't need to change at all.
    """
    transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
    return True, transaction_id
