"""Staff-configurable groups for organizing people on the team page."""

from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Prefetch

from coalition.content.html_sanitizer import HTMLSanitizer

from .slug import SLUG_MAX_LENGTH, create_unique_slug

if TYPE_CHECKING:
    from typing import Any, Self


class PersonGroupQuerySet(models.QuerySet["PersonGroup"]):
    """Queries that share the public-team publication boundary."""

    def publishable(self) -> "Self":
        """Keep visible groups that contain at least one active person."""
        return self.filter(is_visible=True, people__is_active=True).distinct()

    def with_public_people(self) -> "Self":
        """Prefetch active people and profile photos in deterministic order."""
        from .person import Person

        active_people = Person.objects.filter(is_active=True).select_related(
            "profile_image",
        )
        return self.publishable().prefetch_related(
            Prefetch("people", queryset=active_people, to_attr="active_people"),
        )


class PersonGroup(models.Model):
    """An ordered public grouping such as a board, staff, or advisory body."""

    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=SLUG_MAX_LENGTH, unique=True, editable=False)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    objects = PersonGroupQuerySet.as_manager()

    class Meta:
        db_table = "person_group"
        ordering = ["order", "pk"]
        verbose_name = "Person Group"
        verbose_name_plural = "Person Groups"

    def __str__(self) -> str:
        return self.name

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize public text and establish the immutable creation slug."""
        self.name = HTMLSanitizer.sanitize_plain_text(self.name)
        self.description = HTMLSanitizer.sanitize_plain_text(self.description)
        if self._state.adding:
            self.slug = create_unique_slug(
                PersonGroup.objects.all(),
                self.name,
                SLUG_MAX_LENGTH,
            )

        self.full_clean()
        super().save(*args, **kwargs)
