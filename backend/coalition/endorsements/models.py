import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from coalition.stakeholders.models import Stakeholder


class Endorsement(models.Model):
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

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["stakeholder", "campaign"]

    def __str__(self) -> str:
        return f"{self.stakeholder} endorses {self.campaign}"

    @property
    def is_verification_expired(self) -> bool:
        """Check if email verification link has expired (24 hours)"""
        if not self.verification_sent_at:
            return False
        expiry_time = self.verification_sent_at + timedelta(hours=24)
        return timezone.now() > expiry_time

    def verify_email(self) -> None:
        """Mark email as verified"""
        self.email_verified = True
        self.verified_at = timezone.now()
        self.save()
