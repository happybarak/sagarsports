from django.contrib import admin

from apps.orders.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "variant", "product_name_snapshot", "price_snapshot", "quantity"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number",
        "user",
        "status",
        "payment_status",
        "total",
        "created_at",
    ]
    list_filter = ["status", "payment_status"]
    search_fields = ["order_number", "user__email"]
    readonly_fields = ["order_number"]
    inlines = [OrderItemInline]
