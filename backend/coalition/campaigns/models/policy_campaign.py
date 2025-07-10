"""PolicyCampaign model for advocacy campaigns."""

from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any

    from .bill import Bill


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

    class Meta:
        db_table = "campaign"

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
