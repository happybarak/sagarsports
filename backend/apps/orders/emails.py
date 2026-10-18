import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_order_confirmation_emails(order):
    """
    Sends:
    1. Branded Order Confirmation Email to the customer (HTML + text).
    2. Instant New-Order Alert to the store admin/owner.
    Wrapped in try/except with logging so email delivery never blocks or crashes
    the checkout response if SMTP credentials are temporarily unavailable.
    """
    try:
        _send_customer_confirmation(order)
    except Exception as exc:
        logger.error("Failed to send customer order confirmation for order %s: %s", order.id, exc)

    try:
        _send_admin_new_order_alert(order)
    except Exception as exc:
        logger.error("Failed to send admin order alert for order %s: %s", order.id, exc)


def _send_customer_confirmation(order):
    customer_email = order.user.email if order.user else order.guest_email
    if not customer_email:
        logger.warning("Order %s has no recipient email; skipping confirmation email.", order.id)
        return

    customer_name = order.shipping_full_name or "Valued Customer"
    order_items = order.items.all()

    # Build order tracking URL
    frontend_url = getattr(settings, "FRONTEND_URL", "https://sagarsports.shop").rstrip("/")
    if order.claim_token:
        order_url = f"{frontend_url}/orders/{order.id}?claim_token={order.claim_token}"
    else:
        order_url = f"{frontend_url}/orders/{order.id}"

    payment_method_label = (
        "Cash on Delivery"
        if order.payment_method == "cod"
        else "Online Payment (Razorpay / UPI / Card)"
    )
    payment_status_label = (
        "Paid" if order.payment_status == "paid" else "Cash to be collected upon delivery"
    )

    subject = f"Order Confirmed: #{order.order_number} — Sagar Sports"

    # Plain text version
    items_text = []
    for item in order_items:
        variant_info = f" ({item.variant_label_snapshot})" if item.variant_label_snapshot else ""
        items_text.append(
            f"- {item.product_name_snapshot}{variant_info} x {item.quantity} = Rs. {item.line_total}"
        )
    items_block = "\n".join(items_text)

    shipping_str = "FREE" if order.shipping_cost == 0 else f"Rs. {order.shipping_cost}"
    cod_str = f"\nCOD Fee: Rs. {order.cod_fee}" if order.cod_fee > 0 else ""

    text_body = f"""Hi {customer_name},

Thank you for shopping with Sagar Sports! Your order #{order.order_number} has been received and confirmed.

ORDER SUMMARY:
---------------------------------------------
{items_block}

Subtotal: Rs. {order.subtotal}
Shipping: {shipping_str}
Taxes (GST 18%): Rs. {order.tax}{cod_str}
Grand Total: Rs. {order.total}

Payment Method: {payment_method_label} ({payment_status_label})

DELIVERY ADDRESS:
---------------------------------------------
{order.shipping_full_name}
{order.shipping_address_line_1}
{order.shipping_address_line_2 or ""}
{order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
Phone: {order.shipping_phone}

Track your order anytime at:
{order_url}

Need help? Call us at 9255552245 or reply to this email.

— Sagar Sports Team
Kharkhoda (131402), Haryana, India
https://sagarsports.shop
"""

    # Responsive HTML version
    items_html_rows = []
    for item in order_items:
        variant_html = (
            f"<div style='font-size:12px;color:#6b7280;'>{item.variant_label_snapshot}</div>"
            if item.variant_label_snapshot
            else ""
        )
        items_html_rows.append(
            f"""
            <tr>
              <td style='padding:12px;border-bottom:1px solid #e5e7eb;'>
                <div style='font-weight:600;color:#111827;'>{item.product_name_snapshot}</div>
                {variant_html}
              </td>
              <td style='padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;'>
                {item.quantity}
              </td>
              <td style='padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111827;'>
                &#8377;{item.line_total:,.2f}
              </td>
            </tr>
            """
        )
    items_html = "".join(items_html_rows)

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    </head>
    <body style='margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'>
      <div style='max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);'>
        
        <!-- Header -->
        <div style='background-color:#0f172a;padding:24px 32px;text-align:center;'>
          <h1 style='color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;font-weight:bold;'>
            SAGAR SPORTS
          </h1>
          <p style='color:#94a3b8;margin:6px 0 0 0;font-size:13px;'>Move. Perform. Repeat.</p>
        </div>

        <!-- Body -->
        <div style='padding:32px;'>
          <h2 style='color:#111827;font-size:20px;margin-top:0;'>Order Confirmed!</h2>
          <p style='color:#4b5563;font-size:15px;line-height:24px;'>
            Hi <strong>{customer_name}</strong>,<br>
            Thank you for shopping with Sagar Sports. We have received your order 
            <strong>#{order.order_number}</strong> and our team is preparing it for shipment from our factory.
          </p>

          <!-- Order Info Box -->
          <div style='background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;'>
            <div style='font-size:13px;color:#6b7280;'>Order Number: <strong style='color:#111827;'>#{order.order_number}</strong></div>
            <div style='font-size:13px;color:#6b7280;margin-top:4px;'>Payment Method: <strong style='color:#111827;'>{payment_method_label}</strong></div>
            <div style='font-size:13px;color:#6b7280;margin-top:4px;'>Payment Status: <strong style='color:#111827;'>{payment_status_label}</strong></div>
          </div>

          <!-- Items Table -->
          <table style='width:100%;border-collapse:collapse;margin:24px 0;'>
            <thead>
              <tr style='background:#f9fafb;font-size:12px;text-transform:uppercase;color:#6b7280;'>
                <th style='padding:10px 12px;text-align:left;'>Item</th>
                <th style='padding:10px 12px;text-align:center;'>Qty</th>
                <th style='padding:10px 12px;text-align:right;'>Price</th>
              </tr>
            </thead>
            <tbody>
              {items_html}
            </tbody>
          </table>

          <!-- Totals -->
          <div style='margin-left:auto;max-width:280px;border-top:2px solid #e5e7eb;padding-top:12px;'>
            <div style='display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#4b5563;'>
              <span>Subtotal:</span>
              <span style='font-weight:600;'>&#8377;{order.subtotal:,.2f}</span>
            </div>
            <div style='display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#4b5563;'>
              <span>Shipping:</span>
              <span style='font-weight:600;'>{shipping_str}</span>
            </div>
            <div style='display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#4b5563;'>
              <span>Taxes (GST 18%):</span>
              <span style='font-weight:600;'>&#8377;{order.tax:,.2f}</span>
            </div>
            {f"<div style='display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#4b5563;'><span>COD Charge:</span><span style='font-weight:600;'>&#8377;{order.cod_fee:,.2f}</span></div>" if order.cod_fee > 0 else ""}
            <div style='display:flex;justify-content:space-between;padding:8px 0;font-size:16px;color:#111827;font-weight:bold;border-top:1px solid #e5e7eb;margin-top:6px;'>
              <span>Grand Total:</span>
              <span style='color:#b91c1c;'>&#8377;{order.total:,.2f}</span>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style='background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:24px 0;'>
            <div style='font-size:12px;text-transform:uppercase;font-weight:bold;color:#6b7280;margin-bottom:8px;'>Shipping Address</div>
            <div style='font-size:14px;color:#111827;line-height:20px;'>
              <strong>{order.shipping_full_name}</strong><br>
              {order.shipping_address_line_1}<br>
              {f"{order.shipping_address_line_2}<br>" if order.shipping_address_line_2 else ""}
              {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}<br>
              Phone: {order.shipping_phone}
            </div>
          </div>

          <!-- Action Button -->
          <div style='text-align:center;margin:32px 0 16px 0;'>
            <a href='{order_url}' style='background-color:#b91c1c;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;display:inline-block;'>
              View &amp; Track Order
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style='background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px;text-align:center;font-size:12px;color:#6b7280;'>
          <p style='margin:0 0 6px 0;'>Questions? Call our customer support at <strong style='color:#111827;'>9255552245</strong></p>
          <p style='margin:0;'>Sagar Sports, Kharkhoda (131402), Haryana, India &bull; <a href='https://sagarsports.shop' style='color:#6b7280;'>sagarsports.shop</a></p>
        </div>

      </div>
    </body>
    </html>
    """

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Sagar Sports <orders@sagarsports.shop>")
    admin_reply_raw = getattr(settings, "ADMIN_NOTIFICATION_EMAIL", None)
    reply_to = (
        [r.strip() for r in admin_reply_raw.split(",") if r.strip()]
        if admin_reply_raw
        else None
    )

    msg = EmailMultiAlternatives(
        subject, text_body, from_email, [customer_email], reply_to=reply_to
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)
    logger.info("Order confirmation email dispatched to %s for order %s", customer_email, order.id)


def _send_admin_new_order_alert(order):
    admin_emails_raw = getattr(
        settings,
        "ADMIN_NOTIFICATION_EMAIL",
        getattr(settings, "DEFAULT_FROM_EMAIL", "orders@sagarsports.shop"),
    )
    if not admin_emails_raw:
        return

    # Support multiple comma-separated emails e.g. "owner@gmail.com, manager@gmail.com"
    if isinstance(admin_emails_raw, str):
        admin_recipients = [e.strip() for e in admin_emails_raw.split(",") if e.strip()]
    elif isinstance(admin_emails_raw, (list, tuple)):
        admin_recipients = list(admin_emails_raw)
    else:
        admin_recipients = [str(admin_emails_raw)]

    if not admin_recipients:
        return

    subject = (
        f"[NEW ORDER] #{order.order_number} - Rs. {order.total:,.2f} by {order.shipping_full_name}"
    )

    items_summary = "\n".join(
        [
            f"- {item.product_name_snapshot} x {item.quantity} (Rs. {item.line_total})"
            for item in order.items.all()
        ]
    )

    frontend_url = getattr(settings, "FRONTEND_URL", "https://sagarsports.shop").rstrip("/")
    admin_order_url = f"{frontend_url}/admin/orders/{order.id}"

    text_body = f"""New order received on Sagar Sports!

ORDER DETAILS:
---------------------------------------------
Order Number: #{order.order_number}
Grand Total: Rs. {order.total}
Payment Method: {order.payment_method.upper()} (Status: {order.payment_status})

CUSTOMER DETAILS:
---------------------------------------------
Name: {order.shipping_full_name}
Phone: {order.shipping_phone}
Email: {order.user.email if order.user else order.guest_email}

SHIPPING ADDRESS:
---------------------------------------------
{order.shipping_address_line_1}
{order.shipping_address_line_2 or ""}
{order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}

ITEMS ORDERED:
---------------------------------------------
{items_summary}

View in Admin Panel:
{admin_order_url}
"""

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Sagar Sports <orders@sagarsports.shop>")
    msg = EmailMultiAlternatives(subject, text_body, from_email, admin_recipients)
    msg.send(fail_silently=False)
    logger.info("Admin alert dispatched for order %s to %s", order.id, admin_recipients)
