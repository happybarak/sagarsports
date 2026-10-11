from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.users.models import Address, User


class UserSerializer(serializers.ModelSerializer):
    """
    Read-only representation of the logged-in user. Returned by
    /api/auth/me/, embedded in the login response, and reused by the full
    profile endpoint later (Phase 11 area).
    """

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_image",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ["email", "password", "password2", "first_name", "last_name", "phone"]

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Same login behavior as SimpleJWT's default (still authenticates on
    USERNAME_FIELD, which is `email`), but the response also embeds the
    user object so the frontend doesn't need a second request right after
    login to populate authSlice.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "full_name",
            "phone",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Read-only, used for both the admin users list and (since it already
    carries everything worth showing) the row itself doubles as the
    "detail view" — no separate detail endpoint needed.
    """

    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_active",
            "is_staff",
            "date_joined",
            "order_count",
            "total_spent",
        ]
        read_only_fields = fields

    def get_order_count(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        from django.db.models import Sum

        from apps.orders.models import Order

        total = obj.orders.filter(payment_status=Order.PaymentStatus.PAID).aggregate(
            total=Sum("total")
        )["total"]
        return total or 0


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password2 = serializers.CharField()

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return attrs
