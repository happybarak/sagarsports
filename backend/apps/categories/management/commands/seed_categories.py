from django.core.management.base import BaseCommand

from apps.categories.models import Category

CATEGORY_TREE = {
    "Computers": ["Laptops", "Desktops", "Monitors"],
    "Mobile": ["Smartphones", "Tablets", "Mobile Accessories"],
    "Accessories": ["Keyboards", "Mouse", "Headphones", "Chargers"],
    "Gaming": ["Gaming Laptops", "Gaming Accessories", "Controllers"],
}


class Command(BaseCommand):
    help = "Seeds a sample category tree so the mega-menu has real data to render."

    def handle(self, *args, **options):
        created_count = 0
        for parent_name, child_names in CATEGORY_TREE.items():
            parent, was_created = Category.objects.get_or_create(name=parent_name)
            created_count += int(was_created)
            for child_name in child_names:
                _, child_created = Category.objects.get_or_create(
                    name=child_name, parent=parent
                )
                created_count += int(child_created)

        self.stdout.write(
            self.style.SUCCESS(f"Seeded categories — {created_count} new record(s) created.")
        )
