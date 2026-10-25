import base64
import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.request
import uuid
from decimal import Decimal

from django.conf import settings

logger = logging.getLogger(__name__)


def process_mock_payment(amount):
    """
    Stand-in mock payment used when Razorpay keys are not configured.
    """
    transaction_id = f"MOCK-{uuid.uuid4().hex[:12].upper()}"
    return True, transaction_id


def create_razorpay_order(order):
    """
    Creates a Razorpay order via Razorpay SDK (if installed) or standard REST API.
    If RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured, gracefully falls back to mock.
    Amount sent to Razorpay is in paise (INR 1 = 100 paise).
    """
    amount_paise = int(round(Decimal(str(order.total)) * 100))
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")

    # If Razorpay credentials are not provided, fall back to mock (in local dev only)
    if not key_id or not key_secret or key_id.startswith("rzp_test_change"):
        if not getattr(settings, "DEBUG", False):
            raise RuntimeError(
                "Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on the server."
            )
        _, mock_id = process_mock_payment(order.total)
        return {
            "order_id": mock_id,
            "amount": amount_paise,
            "currency": "INR",
            "key_id": key_id or "mock_key",
            "is_mock": True,
        }

    # 1. Try using the official razorpay python client if installed
    try:
        import razorpay

        client = razorpay.Client(auth=(key_id, key_secret))
        rzp_order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order.order_number[:40],
                "notes": {
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "customer_name": order.shipping_full_name,
                    "customer_phone": order.shipping_phone,
                },
            }
        )
        return {
            "order_id": rzp_order["id"],
            "amount": rzp_order["amount"],
            "currency": rzp_order["currency"],
            "key_id": key_id,
            "is_mock": False,
        }
    except ImportError:
        logger.info("razorpay package not installed in environment, using urllib fallback.")
    except Exception as exc:
        logger.error("Failed to create Razorpay order via SDK: %s", exc)

    # 2. Standard library HTTP fallback directly to Razorpay REST API
    try:
        url = "https://api.razorpay.com/v1/orders"
        payload = json.dumps(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order.order_number[:40],
                "notes": {
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                    "customer_name": order.shipping_full_name,
                },
            }
        ).encode("utf-8")

        auth_header = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {auth_header}",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "order_id": data["id"],
                "amount": data["amount"],
                "currency": data["currency"],
                "key_id": key_id,
                "is_mock": False,
            }
    except Exception as exc:
        logger.exception("Razorpay API order creation failed: %s", exc)
        raise RuntimeError(f"Could not create Razorpay order: {exc}") from exc


def verify_razorpay_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Cryptographically verifies the Razorpay payment signature using HMAC-SHA256.
    Returns True if valid, False otherwise.
    """
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")

    # In mock mode (strictly restricted to local development)
    if getattr(settings, "DEBUG", False) and razorpay_order_id.startswith("MOCK-"):
        return True

    if not key_secret or not razorpay_signature or not razorpay_payment_id:
        return False

    try:
        import razorpay

        client = razorpay.Client(auth=(getattr(settings, "RAZORPAY_KEY_ID", ""), key_secret))
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
        return True
    except ImportError:
        pass
    except Exception as exc:
        logger.warning("SDK signature verification failed, testing manual HMAC: %s", exc)

    # Standard HMAC-SHA256 computation: hmac_sha256(order_id + "|" + payment_id, secret)
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        key_secret.encode("utf-8"), message, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, razorpay_signature)


def verify_razorpay_webhook_signature(body_bytes, signature):
    """
    Verifies Razorpay webhook signature against RAZORPAY_WEBHOOK_SECRET.
    """
    webhook_secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")
    if not webhook_secret or not signature:
        return False

    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"), body_bytes, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)
