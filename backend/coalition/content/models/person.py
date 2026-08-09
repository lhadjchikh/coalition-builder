"""People displayed on the public team and optional biography pages."""

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import models
from tinymce.models import HTMLField

from coalition.content.html_sanitizer import HTMLSanitizer

from .slug import SLUG_MAX_LENGTH, create_unique_slug

if TYPE_CHECKING:
    from typing import Any


class Person(models.Model):
    """A staff-managed person assigned to one ordered public group."""

    group = models.ForeignKey(
        "content.PersonGroup",
        on_delete=models.PROTECT,
        related_name="people",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=SLUG_MAX_LENGTH, unique=True, editable=False)
    title = models.CharField(max_length=200)
    bio = HTMLField(blank=True)
    headshot = models.ForeignKey(
        "content.Image",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="person_headshots",
    )
    email = models.EmailField(blank=True)
    linkedin_url = models.URLField(
        blank=True,
        validators=[URLValidator(schemes=["http", "https"])],
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    profile_page_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "person"
        ordering = ["order", "pk"]
        verbose_name = "Person"
        verbose_name_plural = "People"

    def __str__(self) -> str:
        return self.name

    @property
    def headshot_url(self) -> str:
        """Return the headshot URL or an empty public value."""
        return self.headshot.image_url if self.headshot else ""

    @property
    def headshot_alt_text(self) -> str:
        """Return the stored headshot alt text or an empty public value."""
        return self.headshot.alt_text if self.headshot else ""

    @property
    def headshot_title(self) -> str:
        """Return the headshot title or an empty public value."""
        return self.headshot.title if self.headshot else ""

    @property
    def headshot_author(self) -> str:
        """Return the headshot author or an empty public value."""
        return self.headshot.author if self.headshot else ""

    @property
    def headshot_license(self) -> str:
        """Return the headshot license or an empty public value."""
        return self.headshot.license if self.headshot else ""

    @property
    def headshot_source_url(self) -> str:
        """Return the headshot source URL or an empty public value."""
        return self.headshot.source_url if self.headshot else ""

    @property
    def headshot_caption(self) -> str:
        """Return the headshot caption or an empty public value."""
        return self.headshot.caption if self.headshot else ""

    @property
    def headshot_caption_display(self) -> str:
        """Return the headshot caption mode or an empty public value."""
        return self.headshot.caption_display if self.headshot else ""

    def clean(self) -> None:
        """Require meaningful biography content before publishing a profile page."""
        super().clean()
        if self.profile_page_enabled and not HTMLSanitizer.sanitize_plain_text(
            self.bio,
        ):
            raise ValidationError(
                {"bio": "A biography is required when the profile page is enabled."},
            )

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize public content and establish the immutable creation slug."""
        self.name = HTMLSanitizer.sanitize_plain_text(self.name)
        self.title = HTMLSanitizer.sanitize_plain_text(self.title)
        self.bio = HTMLSanitizer.sanitize_bio(self.bio)
        if self._state.adding:
            self.slug = create_unique_slug(
                Person.objects.all(),
                self.name,
                SLUG_MAX_LENGTH,
            )

        self.full_clean()
        super().save(*args, **kwargs)
