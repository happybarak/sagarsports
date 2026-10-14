from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.common.mixins import UserOwnedCreateMixin, UserQuerySetMixin
from apps.common.responses import success_response
from apps.users.models import Address, User
from apps.users.serializers import (
    AdminUserSerializer,
    AddressSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates the account and logs the user in immediately (returns tokens),
    so the frontend can go straight from the registration form into an
    authenticated session without a separate login step.

    Optionally accepts claim_order_id + claim_token — set when a guest
    registers from their order confirmation page ("create an account to
    save this order"). Only attaches the order if the token matches
    exactly and the order is still unclaimed; a wrong/missing token just
    silently skips the claim rather than erroring the whole registration.
    """

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        self._maybe_claim_guest_order(request, user)

        refresh = RefreshToken.for_user(user)
        return success_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            message="Account created successfully.",
            status_code=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _maybe_claim_guest_order(request, user):
        order_id = request.data.get("claim_order_id")
        token = request.data.get("claim_token")
        if not order_id or not token:
            return

        from apps.orders.models import Order

        Order.objects.filter(
            id=order_id, claim_token=token, user__isnull=True
        ).update(user=user, claim_token=None)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Identical wire format to SimpleJWT's default login, plus an embedded
    `user` object in the response (see CustomTokenObtainPairSerializer).
    """

    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout/  { "refresh": "<refresh token>" }
    Blacklists the refresh token so it can no longer be used to mint new
    access tokens. The frontend also clears its stored tokens on logout —
    this endpoint is what makes that logout actually irreversible server-side.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "message": "Refresh token is required.", "errors": {"refresh": "This field is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"success": False, "message": "Invalid or already-expired token.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return success_response(message="Logged out successfully.")


class MeView(generics.RetrieveAPIView):
    """
    GET /api/auth/me/
    Used by the frontend on app load to rehydrate authSlice from a stored
    access token, without the user having to log in again every refresh.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class AddressViewSet(UserQuerySetMixin, UserOwnedCreateMixin, viewsets.ModelViewSet):
    """
    Full CRUD for the logged-in user's own addresses at
    /api/users/addresses/. Setting is_default=true on one address auto-
    unsets any other default for that user — handled by Address.save()
    on the model itself, not duplicated here.
    """

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    queryset = Address.objects.all()


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/admin/users/ — every customer/staff account. Staff-only,
    read-only (account edits stay in Django admin for this MVP).
    """

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    search_fields = ["email", "first_name", "last_name"]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/request/  { email }
    Always returns a generic success message, whether or not that email
    has an account — confirming/denying account existence here would let
    an attacker enumerate registered emails. If a matching active user
    exists, sends a reset link (via EMAIL_BACKEND — console in dev) built
    from Django's stateless token generator, so no reset-token table is
    needed and tokens can't be replayed after the password changes (the
    generator hashes in the current password, so it invalidates itself).
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            send_mail(
                subject="Reset your Novaris password",
                message=(
                    f"Hi {user.first_name or user.email},\n\n"
                    f"Click the link below to reset your password:\n{reset_url}\n\n"
                    "If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return success_response(
            message="If that email has an account, we've sent a password reset link."
        )


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/  { uid, token, new_password, new_password2 }"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None

        if user is None or not default_token_generator.check_token(user, data["token"]):
            return Response(
                {
                    "success": False,
                    "message": "This password reset link is invalid or has expired.",
                    "errors": {},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data["new_password"])
        user.save()
        return success_response(message="Your password has been reset. You can now log in.")
