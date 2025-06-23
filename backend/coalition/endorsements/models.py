import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from coalition.stakeholders.models import Stakeholder


class Endorsement(models.Model):
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
    )
    campaign = models.ForeignKey(
        "campaigns.PolicyCampaign",
        on_delete=models.CASCADE,
        related_name="endorsements",
    )
    statement = models.TextField(blank=True)
    public_display = models.BooleanField(default=True)

    # Email verification fields
    verification_token = models.UUIDField(default=uuid.uuid4, unique=True)
    email_verified = models.BooleanField(default=False)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Admin moderation fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_notes = models.TextField(blank=True, help_text="Internal notes for admins")
    reviewed_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_endorsements",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["stakeholder", "campaign"]

    def __str__(self) -> str:
        return f"{self.stakeholder} endorses {self.campaign} ({self.status})"

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
        # Auto-approve verified endorsements (can be configured per campaign)
        if self.status == "pending":
            self.status = "approved"
        self.save()
