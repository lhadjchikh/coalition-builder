"""Bill model for legislative bills linked to campaigns."""

from django.core.exceptions import ValidationError
from django.db import models

from coalition.campaigns.constants import (
    BILL_PREFIXES,
    CHAMBER_CHOICES,
    LEVEL_CHOICES,
)


class Bill(models.Model):
    """Model representing legislative bills at federal and state levels."""

    level = models.CharField(
        max_length=10,
        choices=LEVEL_CHOICES,
        default="federal",
        help_text="Whether this is a federal or state bill",
    )
    policy = models.ForeignKey(
        "campaigns.PolicyCampaign",
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

    class Meta:
        db_table = "bill"
        verbose_name = "Bill"
        verbose_name_plural = "Bills"
        ordering = ["-introduced_date", "chamber", "number"]

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
