from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.common.responses import success_response
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import (
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusUpdateSerializer,
    OrderSerializer,
    restock_order_items,
)
from apps.products.models import Product, ProductVariant
from apps.users.models import Address

FREE_SHIPPING_THRESHOLD = Decimal("5000.00")
FLAT_SHIPPING_COST = Decimal("99.00")
TAX_RATE = Decimal("0.18")  # 18% GST


COD_FEE = Decimal("100.00")  # flat Cash-on-Delivery handling charge (Rs 100)


def parse_payment_method(request):
    """
    Reads/validates `payment_method`. Defaults to online so clients that
    don't send it keep working. Returns (method, None) or (None, error_response).
    """
    method = request.data.get("payment_method", Order.PaymentMethod.ONLINE)
    if method not in Order.PaymentMethod.values:
        return None, Response(
            {
                "success": False,
                "message": "Invalid payment method.",
                "errors": {"payment_method": "Must be 'online' or 'cod'."},
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    return method, None


def calculate_order_totals(subtotal, payment_method=Order.PaymentMethod.ONLINE):
    """
    Single source of truth for shipping/tax/COD-fee/total math — used here at
    order creation (authoritative) and mirrored on the frontend's order
    summary step (a preview only; the backend always recalculates
    independently rather than trusting whatever the client sends).
    """
    shipping_cost = Decimal("0.00") if subtotal >= FREE_SHIPPING_THRESHOLD else FLAT_SHIPPING_COST
    tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
    discount = Decimal("0.00")  # no promo/coupon system
    cod_fee = COD_FEE if payment_method == Order.PaymentMethod.COD else Decimal("0.00")
    total = subtotal + shipping_cost + tax + cod_fee - discount
    return shipping_cost, tax, discount, cod_fee, total


class OrderListCreateView(generics.ListAPIView):
    """
    GET /api/orders/  — the requesting user's own order history
    (authenticated only — a guest has no history to list).
    POST /api/orders/  — creates an order. Two shapes, branched on auth:

    Authenticated: { address_id } — pulls from their server-side Cart.
    Guest:  { guest_email, items: [{product_id, variant_id?, quantity}],
              shipping_full_name, shipping_phone, shipping_address_line_1,
              shipping_address_line_2?, shipping_city, shipping_state,
              shipping_postal_code, shipping_country }
      — items come straight from the request (a guest cart only exists in
      the browser's localStorage, never touches the server Cart model),
      and shipping fields are stored directly rather than resolved via a
      saved Address (a guest has no account to own one). The response
      includes a one-time claim_token so the guest can view this specific
      order without logging in, and (if they choose) attach it to a new
      account via RegisterView.

    Both paths validate stock for every line *before* creating anything,
    snapshot price/name onto the order, decrement stock, and run inside
    one atomic transaction.
    """

    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("shipping_address")
            .prefetch_related(
                "items__product__images",
                "items__variant",
            )
        )

    def post(self, request):
        if request.user.is_authenticated:
            return self._create_authenticated_order(request)
        return self._create_guest_order(request)

    def _create_authenticated_order(self, request):
        address_id = request.data.get("address_id")
        if not address_id:
            return Response(
                {
                    "success": False,
                    "message": "Shipping address is required.",
                    "errors": {"address_id": "This field is required."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        address = get_object_or_404(Address, id=address_id, user=request.user)
        payment_method, error_response = parse_payment_method(request)
        if error_response:
            return error_response

        empty_response = Response(
            {"success": False, "message": "Your cart is empty.", "errors": {}},
            status=status.HTTP_400_BAD_REQUEST,
        )
        with transaction.atomic():
            # Locking the cart row serialises double-submits of the same cart:
            # the second request waits, then finds the cart already emptied.
            cart = Cart.objects.select_for_update().filter(user=request.user).first()
            if cart is None:
                return empty_response
            cart_items = list(cart.items.select_related("product", "variant").all())
            if not cart_items:
                return empty_response

            line_items = [
                {
                    "product": item.product,
                    "variant": item.variant,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                }
                for item in cart_items
            ]
            error_response = self._lock_and_validate_stock(line_items)
            if error_response:
                return error_response

            subtotal = sum(
                (li["unit_price"] * li["quantity"] for li in line_items), Decimal("0.00")
            )
            shipping_cost, tax, discount, cod_fee, total = calculate_order_totals(
                subtotal, payment_method
            )
            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                discount=discount,
                payment_method=payment_method,
                cod_fee=cod_fee,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                shipping_address=address,
                shipping_full_name=address.full_name,
                shipping_phone=address.phone,
                shipping_address_line_1=address.address_line_1,
                shipping_address_line_2=address.address_line_2,
                shipping_city=address.city,
                shipping_state=address.state,
                shipping_postal_code=address.postal_code,
                shipping_country=address.country,
            )
            self._create_items_and_decrement_stock(order, line_items)
            cart.items.all().delete()

        return success_response(
            data=OrderSerializer(order, context={"request": request}).data,
            message="Order placed successfully.",
            status_code=status.HTTP_201_CREATED,
        )

    def _create_guest_order(self, request):
        data = request.data
        required_fields = [
            "guest_email",
            "items",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address_line_1",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
        ]
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return Response(
                {
                    "success": False,
                    "message": "Missing required checkout information.",
                    "errors": {field: "This field is required." for field in missing},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_items = data.get("items") or []
        if not isinstance(raw_items, list) or not raw_items:
            return Response(
                {"success": False, "message": "Your cart is empty.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        line_items = []
        for entry in raw_items:
            try:
                product = Product.objects.get(id=entry.get("product_id"), is_active=True)
            except (Product.DoesNotExist, TypeError, ValueError):
                return Response(
                    {
                        "success": False,
                        "message": "One of the items in your cart is no longer available.",
                        "errors": {},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            variant = None
            if entry.get("variant_id"):
                variant = ProductVariant.objects.filter(
                    id=entry["variant_id"], product=product
                ).first()
            try:
                quantity = max(1, int(entry.get("quantity", 1)))
            except (TypeError, ValueError):
                quantity = 1
            unit_price = product.effective_price + (
                variant.price_delta if variant else Decimal("0.00")
            )
            line_items.append(
                {
                    "product": product,
                    "variant": variant,
                    "quantity": quantity,
                    "unit_price": unit_price,
                }
            )

        error_response = self._validate_stock(line_items)
        if error_response:
            return error_response

        subtotal = sum((li["unit_price"] * li["quantity"] for li in line_items), Decimal("0.00"))
        payment_method, error_response = parse_payment_method(request)
        if error_response:
            return error_response
        shipping_cost, tax, discount, cod_fee, total = calculate_order_totals(
            subtotal, payment_method
        )

        import uuid as uuid_module

        with transaction.atomic():
            error_response = self._lock_and_validate_stock(line_items)
            if error_response:
                return error_response
            order = Order.objects.create(
                user=None,
                guest_email=data["guest_email"],
                claim_token=uuid_module.uuid4(),
                subtotal=subtotal,
                discount=discount,
                payment_method=payment_method,
                cod_fee=cod_fee,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                shipping_full_name=data["shipping_full_name"],
                shipping_phone=data["shipping_phone"],
                shipping_address_line_1=data["shipping_address_line_1"],
                shipping_address_line_2=data.get("shipping_address_line_2", ""),
                shipping_city=data["shipping_city"],
                shipping_state=data["shipping_state"],
                shipping_postal_code=data["shipping_postal_code"],
                shipping_country=data.get("shipping_country", "India"),
            )
            self._create_items_and_decrement_stock(order, line_items)

        return success_response(
            data={
                **OrderSerializer(order, context={"request": request}).data,
                # Only ever returned here, at creation — never on subsequent
                # GETs, so it can't leak through a later shared/cached response.
                "claim_token": str(order.claim_token),
            },
            message="Order placed successfully.",
            status_code=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _lock_and_validate_stock(line_items):
        """Lock product/variant rows (in id order, avoiding deadlocks), swap in
        the fresh locked instances and re-check stock. Must run inside atomic()."""
        product_ids = sorted({li["product"].id for li in line_items})
        products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids).order_by("id")}
        variant_ids = sorted({li["variant"].id for li in line_items if li["variant"]})
        variants = {v.id: v for v in ProductVariant.objects.select_for_update().filter(id__in=variant_ids).order_by("id")}
        for li in line_items:
            li["product"] = products[li["product"].id]
            if li["variant"]:
                li["variant"] = variants[li["variant"].id]
        return OrderListCreateView._validate_stock(line_items)

    @staticmethod
    def _validate_stock(line_items):
        for item in line_items:
            available_stock = item["variant"].stock if item["variant"] else item["product"].stock
            if item["quantity"] > available_stock:
                return Response(
                    {
                        "success": False,
                        "message": f"{item['product'].name} only has {available_stock} left in stock.",
                        "errors": {"cart": "One or more items exceed available stock."},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return None

    @staticmethod
    def _create_items_and_decrement_stock(order, line_items):
        for item in line_items:
            product, variant = item["product"], item["variant"]
            variant_label = (
                f"{variant.get_variant_type_display()}: {variant.value}" if variant else ""
            )
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                product_name_snapshot=product.name,
                variant_label_snapshot=variant_label,
                price_snapshot=item["unit_price"],
                quantity=item["quantity"],
            )
            if variant:
                variant.stock -= item["quantity"]
                variant.save(update_fields=["stock"])
            else:
                product.stock -= item["quantity"]
                product.save(update_fields=["stock"])


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/:id/?claim_token=<token>
    Logged-in owners can fetch their own order with no token needed. A
    guest can fetch their own just-placed order only by presenting the
    exact claim_token they were given at creation — guessing a sequential
    order id alone is not enough to see someone else's address/items.
    """

    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        order = get_object_or_404(
            Order.objects.select_related("shipping_address").prefetch_related(
                "items__product__images",
                "items__variant",
            ),
            pk=self.kwargs["pk"],
        )
        token = self.request.query_params.get("claim_token")

        is_owner = self.request.user.is_authenticated and order.user_id == self.request.user.id
        is_valid_guest_access = (
            order.claim_token is not None
            and token is not None
            and str(order.claim_token) == token
        )

        if not (is_owner or is_valid_guest_access):
            from django.http import Http404

            raise Http404
        return order


class OrderCancelView(APIView):
    """
    POST /api/orders/:id/cancel/
    Authenticated owners only (guest orders can't be cancelled through
    this endpoint — a reasonable scope trim, not an oversight: it would
    need the same claim_token-based access as viewing, and cancellation
    is a lower-frequency guest need than just seeing their confirmation).
    Only pending/confirmed orders can be cancelled; restocks every item.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            # Lock the order row so two concurrent cancels cannot both pass the
            # status check and restock the same items twice.
            order = get_object_or_404(
                Order.objects.select_for_update(), pk=pk, user=request.user
            )
            if order.status not in (Order.Status.PENDING, Order.Status.CONFIRMED):
                return Response(
                    {
                        "success": False,
                        "message": "This order can no longer be cancelled.",
                        "errors": {},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            restock_order_items(order)
            order.status = Order.Status.CANCELLED
            order.save(update_fields=["status"])

        return success_response(
            data=OrderSerializer(order, context={"request": request}).data,
            message="Order cancelled.",
        )


class AdminOrderListView(generics.ListAPIView):
    """GET /api/admin/orders/ — every order, any customer. Staff-only."""

    serializer_class = AdminOrderListSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["status", "payment_status"]

    def get_queryset(self):
        return (
            Order.objects.all()
            .select_related("user", "shipping_address")
            .prefetch_related(
                "items__product__images",
                "items__variant",
            )
            .order_by("-created_at")
        )


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/admin/orders/:id/ — full detail, any customer's order.
    PATCH /api/admin/orders/:id/  { status }
    Uses a narrow serializer for the update so only `status` is ever
    writable here — see AdminOrderStatusUpdateSerializer's docstring.
    """

    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().select_related("user", "shipping_address").prefetch_related(
        "items__product__images",
        "items__variant",
    )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return AdminOrderStatusUpdateSerializer
        return AdminOrderDetailSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        order = self.get_object()
        return Response(AdminOrderDetailSerializer(order, context={"request": request}).data)


class AdminDashboardSummaryView(APIView):
    """
    GET /api/admin/analytics/summary/
    Powers the admin dashboard home: revenue/order/customer/product
    counts, low-stock products, recent orders, and top products by
    revenue. Staff-only.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        # Local imports to avoid a module-level products/users -> orders
        # -> products/users import cycle at app-loading time.
        from apps.products.models import Product
        from apps.users.models import User

        paid_orders = Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
        total_revenue = paid_orders.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
        total_orders = Order.objects.count()
        total_customers = User.objects.filter(is_staff=False).count()
        total_products = Product.objects.filter(is_active=True).count()

        low_stock_products = Product.objects.filter(is_active=True, stock__lt=5).order_by(
            "stock"
        )[:10]

        recent_orders = Order.objects.select_related("user").order_by("-created_at")[:5]

        top_products = (
            OrderItem.objects.filter(
                order__payment_status=Order.PaymentStatus.PAID, product__isnull=False
            )
            .values("product__id", "product__name")
            .annotate(
                revenue=Sum(
                    ExpressionWrapper(
                        F("price_snapshot") * F("quantity"),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                units_sold=Sum("quantity"),
            )
            .order_by("-revenue")[:5]
        )

        return Response(
            {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "total_customers": total_customers,
                "total_products": total_products,
                "low_stock_products": [
                    {"id": p.id, "name": p.name, "sku": p.sku, "stock": p.stock}
                    for p in low_stock_products
                ],
                "recent_orders": [
                    {
                        "id": o.id,
                        "order_number": o.order_number,
                        "user_email": o.user.email if o.user else o.guest_email,
                        "status": o.status,
                        "total": o.total,
                        "created_at": o.created_at,
                    }
                    for o in recent_orders
                ],
                "top_products": [
                    {
                        "product_id": row["product__id"],
                        "name": row["product__name"],
                        "revenue": row["revenue"],
                        "units_sold": row["units_sold"],
                    }
                    for row in top_products
                ],
            }
        )


class AdminAnalyticsDetailView(APIView):
    """
    GET /api/admin/analytics/detailed/?days=30
    Deeper reporting beyond the dashboard home: a daily revenue trend
    (zero-filled for days with no paid orders, so the chart has no gaps),
    an order-status distribution across ALL orders (not just paid, since
    pending/cancelled counts matter here too), and revenue by category.
    Staff-only.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        days = max(1, min(days, 365))

        since = timezone.now().date() - timedelta(days=days - 1)

        paid_orders_in_range = Order.objects.filter(
            payment_status=Order.PaymentStatus.PAID, created_at__date__gte=since
        )
        daily_rows = (
            paid_orders_in_range.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"), order_count=Count("id"))
            .order_by("day")
        )
        daily_map = {row["day"].isoformat(): row for row in daily_rows}

        revenue_trend = []
        for offset in range(days):
            day = since + timedelta(days=offset)
            key = day.isoformat()
            row = daily_map.get(key)
            revenue_trend.append(
                {
                    "date": key,
                    "revenue": row["revenue"] if row else Decimal("0.00"),
                    "order_count": row["order_count"] if row else 0,
                }
            )

        order_status_breakdown = list(
            Order.objects.values("status").annotate(count=Count("id")).order_by("status")
        )

        category_rows = (
            OrderItem.objects.filter(
                order__payment_status=Order.PaymentStatus.PAID, product__isnull=False
            )
            .values("product__category__id", "product__category__name")
            .annotate(
                revenue=Sum(
                    ExpressionWrapper(
                        F("price_snapshot") * F("quantity"),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                units_sold=Sum("quantity"),
            )
            .order_by("-revenue")
        )
        category_breakdown = [
            {
                "category_id": row["product__category__id"],
                "category": row["product__category__name"],
                "revenue": row["revenue"],
                "units_sold": row["units_sold"],
            }
            for row in category_rows
        ]

        return Response(
            {
                "revenue_trend": revenue_trend,
                "order_status_breakdown": order_status_breakdown,
                "category_breakdown": category_breakdown,
            }
        )
