import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = os.environ["ADMIN_EMAIL"]
password = os.environ["ADMIN_PASSWORD"]

user, created = User.objects.get_or_create(
    email=email,
    defaults={
        "is_staff": True,
        "is_superuser": True,
        "is_active": True,
    },
)

user.is_staff = True
user.is_superuser = True
user.is_active = True
user.set_password(password)
user.save()

print(f"Admin user {'created' if created else 'updated'}: {email}")
