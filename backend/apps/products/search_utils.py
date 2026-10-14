"""
Rule-based "smart search" — expands a search term to include known
synonyms so "notebook" finds laptops, "earbuds" finds headphones, etc.,
without any ML model or external API call. Used by both the main product
search and the autocomplete suggestions endpoint, so results stay
consistent between typing and submitting.
"""

SYNONYM_GROUPS = [
    {"laptop", "laptops", "notebook", "notebooks"},
    {"phone", "phones", "mobile", "mobiles", "smartphone", "smartphones"},
    {"headphone", "headphones", "earphone", "earphones", "earbud", "earbuds"},
    {"charger", "chargers", "adapter", "adapters"},
    {"mouse", "mice"},
    {"keyboard", "keyboards"},
    {"gaming", "game", "games"},
    {"monitor", "monitors", "display", "displays", "screen", "screens"},
    {"tablet", "tablets", "tab", "tabs"},
    {"powerbank", "power bank", "power banks", "battery pack", "battery packs"},
    {"desktop", "desktops", "pc", "pcs"},
]


def expand_search_terms(query):
    """
    Given a raw search string, return a list of terms to OR together —
    the original query plus any synonyms for exact single-word/phrase
    matches. A multi-word query that doesn't exactly match a known synonym
    entry is returned as-is (no partial/fuzzy expansion — deliberately
    simple and predictable, not a real NLP pipeline).
    """
    normalized = query.lower().strip()
    terms = {normalized}
    for group in SYNONYM_GROUPS:
        if normalized in group:
            terms |= group
    return list(terms)
