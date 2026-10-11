class UserQuerySetMixin:
    """
    Scopes a ModelViewSet's queryset to the requesting user. Used by every
    viewset that must never let one logged-in user see another's data:
    Address, Cart, Wishlist, Order. The model must have a `user` FK.

    Usage:
        class AddressViewSet(UserQuerySetMixin, viewsets.ModelViewSet):
            queryset = Address.objects.all()
            serializer_class = AddressSerializer
            permission_classes = [IsAuthenticated]
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(user=self.request.user)


class UserOwnedCreateMixin:
    """
    Auto-assigns the logged-in user as the `user` field on create, so
    frontend requests never need to (and can't spoof) pass a user id.

    Usage: combine with UserQuerySetMixin on the same viewset.
    """

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
