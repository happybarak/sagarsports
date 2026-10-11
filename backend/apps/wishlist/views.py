from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.responses import success_response
from apps.wishlist.models import Wishlist, WishlistItem
from apps.wishlist.serializers import WishlistItemSerializer, WishlistSerializer


def get_or_create_wishlist(user):
    wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


class WishlistView(generics.GenericAPIView):
    """GET /api/wishlist/ — the logged-in user's wishlist, creating it if needed."""

    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist = get_or_create_wishlist(request.user)
        return Response(WishlistSerializer(wishlist, context={"request": request}).data)


class WishlistItemCreateView(generics.CreateAPIView):
    """
    POST /api/wishlist/items/  { product_id }
    Idempotent: wishlisting an already-wishlisted product just returns the
    existing wishlist rather than erroring on the unique_together
    constraint — a heart-icon toggle shouldn't be able to fail this way.
    """

    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wishlist = get_or_create_wishlist(request.user)
        product = serializer.validated_data["product"]

        item, was_created = WishlistItem.objects.get_or_create(
            wishlist=wishlist, product=product
        )

        return success_response(
            data=WishlistSerializer(wishlist, context={"request": request}).data,
            message="Added to wishlist." if was_created else "Already in your wishlist.",
            status_code=status.HTTP_201_CREATED if was_created else status.HTTP_200_OK,
        )


class WishlistItemDeleteView(generics.GenericAPIView):
    """
    DELETE /api/wishlist/items/:id/
    Scoped to the requesting user's own wishlist — matches the same
    ownership pattern as CartItemDetailView.
    """

    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(wishlist__user=self.request.user)

    def delete(self, request, pk):
        item = generics.get_object_or_404(self.get_queryset(), pk=pk)
        wishlist = item.wishlist
        item.delete()
        return success_response(
            data=WishlistSerializer(wishlist, context={"request": request}).data,
            message="Removed from wishlist.",
        )
