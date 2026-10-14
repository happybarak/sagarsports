from django.contrib import admin

from apps.reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "title", "created_at"]
    list_filter = ["rating"]
    search_fields = ["product__name", "user__email", "title", "comment"]
