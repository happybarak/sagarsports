"""
Template-based product description generator. Deliberately rule-based,
not a call to any AI/LLM API — combines a handful of category-flavored
sentence templates with the product's own name/brand/category. Picked
pseudo-randomly (seeded by the product name) so the same inputs always
produce the same output — useful for predictable admin behavior and for
tests, unlike a truly random or model-based generator.
"""

import random

LAPTOP_TEMPLATES = [
    "The {name} from {brand} pairs everyday performance with a build that "
    "holds up — a dependable choice for work, study, or anything in between.",
    "Built for people who just need a laptop that works, the {name} from "
    "{brand} balances speed, portability, and reliability without the fuss.",
]

MOBILE_TEMPLATES = [
    "The {name} from {brand} keeps you connected with a smooth, "
    "responsive experience in a design that fits your pocket and your day.",
    "{brand}'s {name} is built for everyday use — fast enough for what "
    "you need, simple enough to just pick up and go.",
]

AUDIO_TEMPLATES = [
    "The {name} from {brand} delivers clear, balanced sound for music, "
    "calls, and everything in between — comfortable enough for all-day wear.",
    "{brand}'s {name} brings dependable audio quality to your daily "
    "routine, whether you're commuting, working, or just relaxing.",
]

GAMING_TEMPLATES = [
    "Built for performance under pressure, the {name} from {brand} gives "
    "you the responsiveness gaming demands, without unnecessary extras.",
    "The {name} from {brand} is tuned for gaming — quick response times "
    "and a build that can keep up with long sessions.",
]

GENERIC_TEMPLATES = [
    "The {name} from {brand} is a {category_lower} built for everyday "
    "reliability — solid quality at a price that makes sense.",
    "{brand}'s {name} combines practical design with dependable "
    "performance, made for people who just want things that work.",
]

CATEGORY_TEMPLATE_MAP = [
    (["laptop", "notebook", "desktop", "computer"], LAPTOP_TEMPLATES),
    (["mobile", "phone", "tablet"], MOBILE_TEMPLATES),
    (["headphone", "audio", "speaker", "earphone"], AUDIO_TEMPLATES),
    (["gaming", "controller"], GAMING_TEMPLATES),
]


def generate_product_description(name, brand, category_name):
    category_lower = (category_name or "").lower()

    templates = GENERIC_TEMPLATES
    for keywords, template_pool in CATEGORY_TEMPLATE_MAP:
        if any(keyword in category_lower for keyword in keywords):
            templates = template_pool
            break

    # Seeded so the same product name always yields the same pick — makes
    # the "auto-generate" button's output predictable/testable rather than
    # different every click, without needing to persist a chosen index.
    rng = random.Random(name)
    template = rng.choice(templates)

    return template.format(
        name=name,
        brand=brand or "the brand",
        category=category_name or "product",
        category_lower=(category_name or "product").lower(),
    )
