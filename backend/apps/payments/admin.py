from django.contrib import admin

from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["order", "method", "status", "amount", "transaction_id", "created_at"]
    list_filter = ["status", "method"]
    search_fields = ["order__order_number", "transaction_id"]
    readonly_fields = ["transaction_id"]
