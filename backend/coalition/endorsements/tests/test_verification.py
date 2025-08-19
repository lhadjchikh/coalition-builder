"""
Tests for endorsement verification and workflow functionality.
"""

from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign
from coalition.test_base import BaseTestCase

from ..models import Endorsement


class EndorsementVerificationTest(BaseTestCase):
    """Test endorsement model features (email verification, status, etc.)"""

    def setUp(self) -> None:
        super().setUp()
        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="User",
            organization="Test Org",
            email="test@example.com",
            type="individual",
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
        )

        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

    def test_endorsement_defaults(self) -> None:
        """Test default values for new endorsement fields"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        assert endorsement.status == "pending"
        assert not endorsement.email_verified
        assert endorsement.verification_token is not None
        assert endorsement.verification_sent_at is None
        assert endorsement.verified_at is None
        assert endorsement.reviewed_by is None
        assert endorsement.reviewed_at is None
        assert endorsement.admin_notes == ""

    def test_verification_token_uniqueness(self) -> None:
        """Test that verification tokens are unique"""
        endorsement1 = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        # Create another stakeholder and campaign
        stakeholder2 = self.create_stakeholder(
            first_name="Test",
            last_name="User 2",
            organization="Test Org 2",
            email="test2@example.com",
            state=self.virginia,  # Use Region object from fixture
            type="business",
        )
        campaign2 = PolicyCampaign.objects.create(
            name="test-campaign-2",
            title="Test Campaign 2",
            summary="Test summary 2",
        )

        endorsement2 = Endorsement.objects.create(
            stakeholder=stakeholder2,
            campaign=campaign2,
        )

        assert endorsement1.verification_token != endorsement2.verification_token

    def test_is_verification_expired_property(self) -> None:
        """Test verification expiration check"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        # No sent time = not expired
        assert not endorsement.is_verification_expired

        # Just sent = not expired
        endorsement.verification_sent_at = timezone.now()
        endorsement.save()
        assert not endorsement.is_verification_expired

        # Sent 25 hours ago = expired
        endorsement.verification_sent_at = timezone.now() - timedelta(hours=25)
        endorsement.save()
        assert endorsement.is_verification_expired

        # Sent 23 hours ago = not expired
        endorsement.verification_sent_at = timezone.now() - timedelta(hours=23)
        endorsement.save()
        assert not endorsement.is_verification_expired

    def test_should_display_publicly_property(self) -> None:
        """Test public display logic"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            public_display=True,
        )

        # Not verified, not approved = no display
        assert not endorsement.should_display_publicly

        # Verified but not approved = no display
        endorsement.email_verified = True
        endorsement.save()
        assert not endorsement.should_display_publicly

        # Verified and approved but not selected for display = no display
        endorsement.status = "approved"
        endorsement.save()
        assert not endorsement.should_display_publicly

        # Verified, approved, and selected for display = display
        endorsement.display_publicly = True
        endorsement.save()
        assert endorsement.should_display_publicly

        # Verified, approved, selected, but public_display=False = no display
        endorsement.public_display = False
        endorsement.save()
        assert not endorsement.should_display_publicly

    def test_approve_method(self) -> None:
        """Test endorsement approval method"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        assert endorsement.status == "pending"
        assert endorsement.reviewed_by is None
        assert endorsement.reviewed_at is None

        endorsement.approve(user=self.user)

        assert endorsement.status == "approved"
        assert endorsement.reviewed_by == self.user
        assert endorsement.reviewed_at is not None

    def test_reject_method(self) -> None:
        """Test endorsement rejection method"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        notes = "Content not appropriate"
        endorsement.reject(user=self.user, notes=notes)

        assert endorsement.status == "rejected"
        assert endorsement.reviewed_by == self.user
        assert endorsement.reviewed_at is not None
        assert endorsement.admin_notes == notes

    def test_verify_email_method(self) -> None:
        """Test email verification method with default manual review"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        assert not endorsement.email_verified
        assert endorsement.verified_at is None
        assert endorsement.status == "pending"

        endorsement.verify_email()

        assert endorsement.email_verified
        assert endorsement.verified_at is not None
        assert endorsement.status == "verified"  # Verified but awaiting manual approval

    def test_verify_email_with_auto_approval_enabled(self) -> None:
        """Test email verification with auto-approval setting enabled"""
        from django.test import override_settings

        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        assert endorsement.status == "pending"

        # Test with auto-approval enabled
        with override_settings(AUTO_APPROVE_VERIFIED_ENDORSEMENTS=True):
            endorsement.verify_email()

        assert endorsement.email_verified
        assert endorsement.verified_at is not None
        assert endorsement.status == "approved"  # Auto-approved when setting is True

    def test_string_representation_with_status(self) -> None:
        """Test string representation includes status"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        expected = f"{self.stakeholder} endorses {self.campaign} (pending)"
        assert str(endorsement) == expected

        endorsement.status = "approved"
        endorsement.save()
        expected = f"{self.stakeholder} endorses {self.campaign} (approved)"
        assert str(endorsement) == expected
