from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Object-level permission restricting access to the object's owner.
    Assumes the model instance has a `user` attribute — true for Address,
    Cart, Wishlist, Order, and Review. Used on top of IsAuthenticated.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Anyone can read (e.g. product reviews are public); only the review's
    author can update or delete it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Anyone can read (product/category browsing); only staff users can
    create, update, or delete. Used on public catalog viewsets so the same
    endpoint can serve both storefront reads and admin writes.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
