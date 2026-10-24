from django.db.models import Prefetch
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart, CartItem
from apps.cart.serializers import CartItemSerializer, CartSerializer
from apps.common.responses import success_response
from apps.products.models import Product, ProductVariant


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def get_optimized_cart(cart_or_id):
    cart_id = cart_or_id.id if isinstance(cart_or_id, Cart) else cart_or_id
    return (
        Cart.objects.filter(id=cart_id)
        .prefetch_related(
            Prefetch(
                "items",
                queryset=CartItem.objects.select_related("product", "variant").prefetch_related(
                    "product__images"
                ),
            )
        )
        .first()
    )


class CartView(APIView):
    """
    GET /api/cart/
    Returns (creating if necessary) the logged-in user's cart with items,
    subtotal, and total item count.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        optimized_cart = get_optimized_cart(cart)
        return Response(CartSerializer(optimized_cart, context={"request": request}).data)


class CartItemCreateView(generics.CreateAPIView):
    """
    POST /api/cart/items/  { product_id, variant_id?, quantity }
    Adding a product/variant combination that's already in the cart
    increases its quantity instead of erroring on the unique_together
    constraint — matches how "Add to Cart" is expected to behave.
    """

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request.user)
        product = serializer.validated_data["product"]
        variant = serializer.validated_data.get("variant")
        quantity = serializer.validated_data["quantity"]

        existing_item = CartItem.objects.filter(
            cart=cart, product=product, variant=variant
        ).first()

        available_stock = variant.stock if variant else product.stock

        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if new_quantity > available_stock:
                return Response(
                    {
                        "success": False,
                        "message": f"Only {available_stock} left in stock.",
                        "errors": {"quantity": f"Only {available_stock} left in stock."},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            existing_item.quantity = new_quantity
            existing_item.save()
        else:
            CartItem.objects.create(
                cart=cart, product=product, variant=variant, quantity=quantity
            )

        return success_response(
            data=CartSerializer(get_optimized_cart(cart), context={"request": request}).data,
            message="Product added to cart.",
            status_code=status.HTTP_201_CREATED,
        )


class CartItemDetailView(generics.GenericAPIView):
    """
    PATCH /api/cart/items/:id/  { quantity }
    DELETE /api/cart/items/:id/
    Both scoped to the requesting user's own cart items — a user can never
    touch another user's cart item, even by guessing an id.
    """

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def patch(self, request, pk):
        item = generics.get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=CartSerializer(get_optimized_cart(item.cart_id), context={"request": request}).data,
            message="Cart updated.",
        )

    def delete(self, request, pk):
        item = generics.get_object_or_404(self.get_queryset(), pk=pk)
        cart = item.cart
        item.delete()
        return success_response(
            data=CartSerializer(get_optimized_cart(cart.id), context={"request": request}).data,
            message="Item removed from cart.",
        )


class CartSyncView(APIView):
    """
    POST /api/cart/sync/  { items: [{ product_id, variant_id?, quantity }, ...] }
    Called once, right after login, with whatever was in the guest's
    localStorage cart. Merges into the server cart (summing quantities for
    anything already there, capped at available stock) rather than
    overwriting it — so logging in on a second device doesn't wipe out
    items already added there.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart = get_or_create_cart(request.user)
        guest_items = request.data.get("items", [])

        for entry in guest_items:
            try:
                product = Product.objects.get(id=entry.get("product_id"), is_active=True)
            except (Product.DoesNotExist, TypeError, ValueError):
                continue

            variant = None
            variant_id = entry.get("variant_id")
            if variant_id:
                variant = ProductVariant.objects.filter(
                    id=variant_id, product=product
                ).first()

            try:
                quantity = max(1, int(entry.get("quantity", 1)))
            except (TypeError, ValueError):
                quantity = 1

            available_stock = variant.stock if variant else product.stock
            if available_stock <= 0:
                continue

            existing_item = CartItem.objects.filter(
                cart=cart, product=product, variant=variant
            ).first()
            if existing_item:
                existing_item.quantity = min(
                    existing_item.quantity + quantity, available_stock
                )
                existing_item.save()
            else:
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    variant=variant,
                    quantity=min(quantity, available_stock),
                )

        return success_response(
            data=CartSerializer(get_optimized_cart(cart), context={"request": request}).data, message="Cart synced."
        )


class CartClearView(APIView):
    """DELETE /api/cart/clear/ — empties the cart (used after order placement, Phase 11)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return success_response(
            data=CartSerializer(get_optimized_cart(cart), context={"request": request}).data, message="Cart cleared."
        )
