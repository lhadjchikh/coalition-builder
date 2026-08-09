"""Stable slug derivation shared by staff-configurable content models."""

from django.db.models import Model, QuerySet
from django.utils.text import slugify

SLUG_MAX_LENGTH = 200


def create_unique_slug(
    queryset: QuerySet[Model],
    name: str,
    max_length: int = SLUG_MAX_LENGTH,
) -> str:
    """Return a name-derived slug with the first available numeric suffix."""
    base_slug = slugify(name, allow_unicode=True) or "profile"
    existing_slugs = set(
        queryset.filter(slug__startswith=base_slug).values_list("slug", flat=True),
    )
    if base_slug not in existing_slugs:
        return base_slug[:max_length]

    suffix = 2
    while True:
        suffix_text = f"-{suffix}"
        candidate = f"{base_slug[: max_length - len(suffix_text)]}{suffix_text}"
        if candidate not in existing_slugs:
            return candidate
        suffix += 1
