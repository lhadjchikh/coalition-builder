import uuid
from datetime import timedelta
from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from coalition.content.html_sanitizer import HTMLSanitizer
from coalition.stakeholders.models import Stakeholder

if TYPE_CHECKING:
    from typing import Any


class Endorsement(models.Model):
    """
    Represents a stakeholder's endorsement of a policy campaign.

    The endorsement workflow involves multiple steps:
    1. Initial submission (status: pending)
    2. Email verification (status: verified)
    3. Administrative review (status: approved/rejected)
    4. Public display (if approved and consent given)

    Each endorsement links a stakeholder to a campaign and includes
    verification tokens, submission metadata, and moderation tracking.
    Only one endorsement per stakeholder per campaign is allowed.
    """

    STATUS_CHOICES = [
        ("pending", "Pending Email Verification"),
        ("verified", "Email Verified"),
        ("approved", "Approved for Display"),
        ("rejected", "Rejected"),
    ]

    stakeholder = models.ForeignKey(
        Stakeholder,
        on_delete=models.CASCADE,
        related_name="endorsements",
        help_text="The stakeholder making this endorsement",
    )
    campaign = models.ForeignKey(
        "campaigns.PolicyCampaign",
        on_delete=models.CASCADE,
        related_name="endorsements",
        help_text="The policy campaign being endorsed",
    )
    statement = models.TextField(
        blank=True,
        help_text="Optional endorsement statement from the stakeholder",
    )
    public_display = models.BooleanField(
        default=True,
        help_text="Whether this endorsement should be displayed publicly",
    )

    # Email verification fields
    verification_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text="Unique token for email verification",
    )
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether the stakeholder's email has been verified",
    )
    verification_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the verification email was sent",
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the email verification was completed",
    )

    # Admin moderation fields
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Current status of the endorsement",
    )
    admin_notes = models.TextField(blank=True, help_text="Internal notes for admins")
    reviewed_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_endorsements",
        help_text="Admin user who reviewed this endorsement",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this endorsement was reviewed by an admin",
    )

    # Terms acceptance tracking
    terms_accepted = models.BooleanField(
        default=False,
        help_text="Whether the terms of use were accepted",
    )
    terms_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the terms were accepted",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this endorsement was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this endorsement was last updated",
    )

    class Meta:
        db_table = "endorsement"
        unique_together = ["stakeholder", "campaign"]

    def __str__(self) -> str:
        return f"{self.stakeholder} endorses {self.campaign} ({self.status})"

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize statement field before saving to prevent XSS attacks."""
        # Sanitize statement as plain text - endorsements should not contain HTML
        if self.statement:
            self.statement = HTMLSanitizer.sanitize_plain_text(self.statement)

        super().save(*args, **kwargs)

    @property
    def is_verification_expired(self) -> bool:
        """Check if email verification link has expired (24 hours)"""
        if not self.verification_sent_at:
            return False
        expiry_time = self.verification_sent_at + timedelta(hours=24)
        return timezone.now() > expiry_time

    @property
    def should_display_publicly(self) -> bool:
        """Check if endorsement should be displayed publicly"""
        return self.public_display and self.email_verified and self.status == "approved"

    def approve(self, user: User | None = None) -> None:
        """Approve endorsement for public display"""
        self.status = "approved"
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.save()

    def reject(self, user: User | None = None, notes: str = "") -> None:
        """Reject endorsement"""
        self.status = "rejected"
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        if notes:
            self.admin_notes = notes
        self.save()

    def verify_email(self) -> None:
        """Mark email as verified and auto-approve if configured"""
        self.email_verified = True
        self.verified_at = timezone.now()

        # Auto-approve only if configured to do so
        auto_approve = getattr(settings, "AUTO_APPROVE_VERIFIED_ENDORSEMENTS", False)
        if auto_approve and self.status == "pending":
            self.status = "approved"
        elif self.status == "pending":
            self.status = "verified"

        self.save()
