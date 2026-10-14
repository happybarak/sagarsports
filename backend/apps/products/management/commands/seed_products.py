from decimal import Decimal
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from PIL import Image, ImageDraw, ImageFont

from apps.categories.models import Category
from apps.products.models import Product, ProductImage, ProductVariant

# (category_slug, name, brand, price, discount_price, stock, sku, featured,
#  best_seller, new_arrival, placeholder_color)
PRODUCTS = [
    ("laptops", "Novaris Aero 14", "Novaris", "75000.00", "62999.00", 12, "NVR-AERO14", True, True, False, (11, 37, 69)),
    ("laptops", "Novaris Forge 16", "Novaris", "98000.00", None, 8, "NVR-FORGE16", False, False, True, (19, 64, 116)),
    ("desktops", "Novaris Cube Mini", "Novaris", "54000.00", "48999.00", 15, "NVR-CUBEMINI", False, True, False, (30, 111, 217)),
    ("monitors", "Novaris View 27", "Novaris", "22000.00", None, 20, "NVR-VIEW27", True, False, True, (11, 37, 69)),
    ("smartphones", "Novaris Pulse X", "Novaris", "42000.00", "37999.00", 25, "NVR-PULSEX", True, True, True, (19, 64, 116)),
    ("smartphones", "Novaris Pulse Lite", "Novaris", "24000.00", None, 30, "NVR-PULSELITE", False, False, True, (30, 111, 217)),
    ("tablets", "Novaris Slate 11", "Novaris", "35000.00", "31999.00", 10, "NVR-SLATE11", True, False, False, (11, 37, 69)),
    ("mobile-accessories", "Novaris Fast Charger 65W", "Novaris", "2500.00", None, 60, "NVR-CHG65", False, True, False, (19, 64, 116)),
    ("keyboards", "Novaris Type-K Mechanical", "Novaris", "6500.00", "5499.00", 18, "NVR-TYPEK", False, True, False, (30, 111, 217)),
    ("headphones", "Novaris Sound One ANC", "Novaris", "8500.00", "6999.00", 22, "NVR-SOUND1", True, True, True, (11, 37, 69)),
    ("gaming-laptops", "Novaris Strike 15 RTX", "Novaris", "135000.00", None, 6, "NVR-STRIKE15", True, False, False, (19, 64, 116)),
    ("controllers", "Novaris GamePad Pro", "Novaris", "4500.00", "3799.00", 28, "NVR-GAMEPAD", False, False, True, (30, 111, 217)),
    ("mouse", "Novaris Glide Wireless Mouse", "Novaris", "1800.00", None, 40, "NVR-GLIDE", False, False, False, (11, 37, 69)),
    ("chargers", "Novaris PowerBank 20000mAh", "Novaris", "2800.00", "2299.00", 35, "NVR-PWRBANK", False, True, False, (19, 64, 116)),
]

# sku -> [(variant_type, value, price_delta, stock), ...]
# Only "color" and "size" are valid variant types (electronics-specific
# options like RAM/Storage were intentionally removed from the model).
VARIANTS = {
    "NVR-SOUND1": [
        ("color", "Black", "0", 12),
        ("color", "White", "0", 10),
    ],
    "NVR-GAMEPAD": [
        ("color", "Black", "0", 15),
        ("color", "Blue", "200.00", 13),
    ],
}


def generate_placeholder_image(label, color):
    image = Image.new("RGB", (700, 700), color)
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    words = label.split(" ")
    lines, current_line = [], ""
    for word in words:
        candidate = f"{current_line} {word}".strip()
        if len(candidate) > 16:
            lines.append(current_line)
            current_line = word
        else:
            current_line = candidate
    lines.append(current_line)

    line_height = 22
    total_height = line_height * len(lines)
    start_y = (700 - total_height) // 2
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        draw.text(
            ((700 - text_width) // 2, start_y + i * line_height),
            line,
            fill="white",
            font=font,
        )

    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return ContentFile(buffer.getvalue())


class Command(BaseCommand):
    help = "Seeds sample products (with generated placeholder images) across the seeded categories."

    def handle(self, *args, **options):
        created_count = 0
        for (
            category_slug,
            name,
            brand,
            price,
            discount_price,
            stock,
            sku,
            featured,
            best_seller,
            new_arrival,
            color,
        ) in PRODUCTS:
            try:
                category = Category.objects.get(slug=category_slug)
            except Category.DoesNotExist as exc:
                raise CommandError(
                    f"Category '{category_slug}' not found — run "
                    "`python manage.py seed_categories` first."
                ) from exc

            product, was_created = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "description": f"{name} — a {category.name.lower()} product from Novaris, "
                    "built for everyday performance and reliability.",
                    "short_description": f"{brand} {category.name}",
                    "brand": brand,
                    "category": category,
                    "price": Decimal(price),
                    "discount_price": Decimal(discount_price) if discount_price else None,
                    "stock": stock,
                    "featured": featured,
                    "best_seller": best_seller,
                    "new_arrival": new_arrival,
                    "is_active": True,
                },
            )
            created_count += int(was_created)

            if not product.images.exists():
                image_file = generate_placeholder_image(name, color)
                product_image = ProductImage(
                    product=product, is_primary=True, alt_text=name
                )
                product_image.image.save(f"{product.slug}.jpg", image_file, save=True)

            for variant_type, value, price_delta, stock_qty in VARIANTS.get(sku, []):
                ProductVariant.objects.update_or_create(
                    product=product,
                    variant_type=variant_type,
                    value=value,
                    defaults={
                        "price_delta": Decimal(price_delta),
                        "stock": stock_qty,
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded products — {created_count} new record(s) created "
                f"({len(PRODUCTS)} total defined)."
            )
        )
