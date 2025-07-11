from django.core.exceptions import ValidationError
from django.db import models

from coalition.campaigns.constants import CHAMBER_CHOICES, LEVEL_CHOICES


class Legislator(models.Model):
    level = models.CharField(
        max_length=10,
        choices=LEVEL_CHOICES,
        default="federal",
        help_text="Whether this is a federal or state legislator",
    )
    bioguide_id = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique ID from Congress.gov Bioguide (federal legislators only)",
    )
    state_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="State-specific legislator ID (state legislators only)",
    )
    first_name = models.CharField(
        max_length=100,
        help_text="Legislator's first name",
    )
    last_name = models.CharField(
        max_length=100,
        help_text="Legislator's last name",
    )
    chamber = models.CharField(
        max_length=25,
        choices=CHAMBER_CHOICES,
        help_text="Legislative chamber (e.g., house, senate, state_house)",
    )
    state = models.CharField(
        max_length=2,
        help_text="Two-letter state abbreviation",
    )
    state_region = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="legislators",
        help_text="State region for state legislators",
    )
    district = models.CharField(
        max_length=10,
        blank=True,
        help_text="District number (e.g., '5' or 'At-Large')",
    )
    is_senior = models.BooleanField(
        null=True,
        blank=True,
        help_text="For senators: True if senior senator, False if junior",
    )
    party = models.CharField(
        max_length=10,
        help_text="Political party affiliation (e.g., 'D', 'R', 'I')",
    )
    in_office = models.BooleanField(
        default=True,
        help_text="Whether the legislator is currently in office",
    )
    url = models.URLField(
        blank=True,
        help_text="Official website or legislative profile URL",
    )

    def __str__(self) -> str:
        level_prefix = "State " if self.level == "state" else ""
        return (
            f"{level_prefix}{self.first_name} {self.last_name} "
            f"({self.party}-{self.state})"
        )

    def display_name(self) -> str:
        suffix = ""
        if self.level == "federal" and self.chamber == "senate":
            suffix = (
                " (Sr.)"
                if self.is_senior
                else " (Jr.)" if self.is_senior is not None else ""
            )
        elif self.district:
            suffix = f" – District {self.district}"

        level_prefix = "State " if self.level == "state" else ""
        return (
            f"{level_prefix}{self.first_name} {self.last_name}{suffix} – {self.state}"
        )

    def clean(self) -> None:
        super().clean()
        if self.level == "federal" and not self.bioguide_id:
            raise ValidationError("Federal legislators must have a bioguide_id")
        if self.level == "state" and self.bioguide_id:
            raise ValidationError("State legislators should not have a bioguide_id")

    class Meta:
        db_table = "legislator"
        verbose_name = "Legislator"
        verbose_name_plural = "Legislators"
        ordering = ["state", "chamber", "last_name", "first_name"]
        indexes = [
            models.Index(fields=["level", "state", "chamber"]),
            models.Index(fields=["bioguide_id"]),
        ]
