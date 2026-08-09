"""Site-wide configuration models."""

from typing import TYPE_CHECKING
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

if TYPE_CHECKING:
    from typing import Any


def get_timezone_choices() -> list[tuple[str, str]]:
    """Return IANA timezone names for configuration forms."""
    return [(name, name) for name in sorted(available_timezones())]


def validate_timezone_name(timezone_name: str) -> None:
    """Reject values that are not recognized IANA timezone names."""
    try:
        ZoneInfo(timezone_name)
    except (ValueError, ZoneInfoNotFoundError) as error:
        raise ValidationError(
            "Select a valid timezone.",
            code="invalid_timezone",
        ) from error


class SiteConfiguration(models.Model):
    """Singleton configuration shared by the whole site."""

    SINGLETON_PK = 1

    timezone = models.CharField(
        max_length=63,
        default="UTC",
        validators=[validate_timezone_name],
        help_text=(
            "Timezone used for dates and times in the admin site and administrator "
            "notification emails."
        ),
    )

    class Meta:
        verbose_name = "Site configuration"
        verbose_name_plural = "Site configuration"

    def __str__(self) -> str:
        return "Site configuration"

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Validate and persist the single site configuration row."""
        self.pk = self.SINGLETON_PK
        self.full_clean(exclude={"id"})
        super().save(*args, **kwargs)

    @classmethod
    def get_timezone(cls) -> str:
        """Return the configured timezone or Django's default."""
        configured_timezone = cls.objects.values_list("timezone", flat=True).first()
        return configured_timezone or settings.TIME_ZONE
