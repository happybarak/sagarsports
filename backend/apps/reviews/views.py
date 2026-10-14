from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.responses import success_response
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer


class ReviewCreateView(generics.CreateAPIView):
    """
    POST /api/reviews/  { product_id, rating, title?, comment }
    Rejects a second review from the same user on the same product with a
    clean 400 (the unique_together constraint would otherwise surface as
    a raw IntegrityError / 500).
    """

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]

        if Review.objects.filter(user=request.user, product=product).exists():
            return Response(
                {
                    "success": False,
                    "message": "You've already reviewed this product.",
                    "errors": {"product_id": "You've already reviewed this product."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(user=request.user)
        return success_response(
            data=ReviewSerializer(serializer.instance, context={"request": request}).data,
            message="Review submitted.",
            status_code=status.HTTP_201_CREATED,
        )


class ReviewUpdateDeleteView(generics.GenericAPIView):
    """
    PATCH /api/reviews/:id/  { rating?, title?, comment? }
    DELETE /api/reviews/:id/
    Scoped to the requesting user's own reviews — editing or deleting
    someone else's review isn't possible even by guessing an id.
    """

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def patch(self, request, pk):
        review = generics.get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=ReviewSerializer(review, context={"request": request}).data,
            message="Review updated.",
        )

    def delete(self, request, pk):
        review = generics.get_object_or_404(self.get_queryset(), pk=pk)
        review.delete()
        return success_response(message="Review deleted.")
