from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from coalition.campaigns.constants import BILL_PREFIXES, CHAMBER_CHOICES, LEVEL_CHOICES
from coalition.core.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class PolicyCampaign(models.Model):
    """
    Represents a policy advocacy campaign that stakeholders can endorse.

    Campaigns are the central organizing unit of the platform. Each campaign
    represents a specific policy position that organizations and individuals
    can publicly endorse. Campaigns can be linked to specific legislation
    at federal and state levels.

    The campaign includes public-facing content (title, summary, description)
    as well as administrative settings for endorsement collection and moderation.
    """

    name = models.SlugField(
        unique=True,
        help_text="Machine-readable name for the campaign",
    )
    title = models.CharField(
        max_length=200,
        help_text="Public-facing title of the campaign",
    )
    summary = models.TextField(
        help_text="Brief summary of the campaign's goals and position",
    )
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
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when campaign was created",
    )
    active = models.BooleanField(
        default=True,
        help_text="Whether campaign is active and accepting endorsements",
    )

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
    level = models.CharField(
        max_length=10,
        choices=LEVEL_CHOICES,
        default="federal",
        help_text="Whether this is a federal or state bill",
    )
    policy = models.ForeignKey(
        PolicyCampaign,
        on_delete=models.CASCADE,
        related_name="bills",
        help_text="The policy campaign this bill supports",
    )
    number = models.CharField(
        max_length=50,
        help_text="Bill number without prefix (e.g., '123' not 'H.R. 123')",
    )
    title = models.CharField(
        max_length=255,
        help_text="Official title of the bill",
    )
    chamber = models.CharField(
        max_length=25,
        choices=CHAMBER_CHOICES,
        help_text="Legislative chamber where bill was introduced",
    )
    session = models.CharField(
        max_length=20,
        default="119",
        help_text=(
            "Congressional session (e.g., '118') or state session (e.g., '2023-2024')"
        ),
    )
    state = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bills",
        help_text="State for state-level bills",
    )
    introduced_date = models.DateField(
        help_text="Date the bill was introduced",
    )
    status = models.CharField(
        max_length=100,
        blank=True,
        help_text="Current status of the bill (e.g., 'In Committee', 'Passed House')",
    )
    url = models.URLField(
        blank=True,
        help_text="Link to official bill text or legislative tracking page",
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary bill for the campaign",
    )
    related_bill = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companion_bills",
        help_text="Related bill in the other chamber",
    )
    sponsors = models.ManyToManyField(
        "legislators.Legislator",
        related_name="sponsored_bills",
        blank=True,
        help_text="Primary sponsors of the bill",
    )
    cosponsors = models.ManyToManyField(
        "legislators.Legislator",
        related_name="cosponsored_bills",
        blank=True,
        help_text="Cosponsors who have signed onto the bill",
    )

    def __str__(self) -> str:
        if self.level == "federal":
            prefix = BILL_PREFIXES.get(self.chamber, "")
            return f"{prefix} {self.number}"
        else:
            # For state bills, include state name
            state_name = self.state.name if self.state else "Unknown State"
            prefix = BILL_PREFIXES.get(self.chamber, "B")
            return f"{state_name} {prefix} {self.number}"

    def clean(self) -> None:
        super().clean()
        if self.level == "state" and not self.state:
            raise ValidationError("State bills must have a state specified")
        if self.level == "federal" and self.state:
            raise ValidationError("Federal bills should not have a state specified")

    class Meta:
        verbose_name = "Bill"
        verbose_name_plural = "Bills"
        ordering = ["-introduced_date", "chamber", "number"]
