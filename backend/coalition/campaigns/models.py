from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from coalition.core.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class PolicyCampaign(models.Model):
    name = models.SlugField(
        unique=True,
        help_text="Machine-readable name for the campaign",
    )
    title = models.CharField(max_length=200)
    summary = models.TextField()
    description = models.TextField(
        blank=True,
        help_text="Additional context/details about the campaign",
    )
    endorsement_statement = models.TextField(
        blank=True,
        help_text="The exact statement that endorsers are agreeing to support",
    )
    allow_endorsements = models.BooleanField(
        default=True,
        help_text="Allow stakeholders to endorse this campaign",
    )
    endorsement_form_instructions = models.TextField(
        blank=True,
        help_text="Custom instructions shown above the endorsement form",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title

    def current_bills(self) -> "models.QuerySet[Bill]":
        session = f"{((timezone.now().date().year - 1789) // 2) + 1}th"
        return self.bills.filter(congress_session=session)

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize HTML fields before saving to prevent XSS attacks."""
        # Sanitize description field if it contains HTML
        if self.description:
            self.description = HTMLSanitizer.sanitize(self.description)

        # Sanitize other HTML fields
        if self.endorsement_form_instructions:
            self.endorsement_form_instructions = HTMLSanitizer.sanitize(
                self.endorsement_form_instructions,
            )

        # Note: summary and endorsement_statement are plain text, but sanitize anyway
        if self.summary:
            self.summary = HTMLSanitizer.sanitize_plain_text(self.summary)

        if self.endorsement_statement:
            self.endorsement_statement = HTMLSanitizer.sanitize_plain_text(
                self.endorsement_statement,
            )

        super().save(*args, **kwargs)


class Bill(models.Model):
    CHAMBER_CHOICES = [("House", "House"), ("Senate", "Senate")]

    policy = models.ForeignKey(
        PolicyCampaign,
        on_delete=models.CASCADE,
        related_name="bills",
    )
    number = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    chamber = models.CharField(max_length=10, choices=CHAMBER_CHOICES)
    congress_session = models.CharField(max_length=3)
    introduced_date = models.DateField()
    status = models.CharField(max_length=100, blank=True)
    url = models.URLField(blank=True)
    is_primary = models.BooleanField(default=False)
    sponsors = models.ManyToManyField(
        "legislators.Legislator",
        related_name="sponsored_bills",
        blank=True,
    )
    cosponsors = models.ManyToManyField(
        "legislators.Legislator",
        related_name="cosponsored_bills",
        blank=True,
    )

    def __str__(self) -> str:
        prefix = "H.R." if self.chamber == "House" else "S."
        return f"{prefix} {self.number}"
