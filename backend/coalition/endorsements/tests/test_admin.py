"""
Tests for endorsement Django admin interface.
"""

from unittest.mock import Mock, patch

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from ..admin import EndorsementAdmin
from ..email_service import EndorsementEmailService
from ..models import Endorsement


class EndorsementAdminTest(TestCase):
    """Test endorsement admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = EndorsementAdmin(Endorsement, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.stakeholder = Stakeholder.objects.create(
            name="Test User",
            organization="Test Org",
            email="test@example.com",
            state="MD",
            type="individual",
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
        )

        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="Test statement",
        )

    def test_stakeholder_name_method(self) -> None:
        """Test stakeholder_name admin method"""
        result = self.admin.stakeholder_name(self.endorsement)
        assert result == "Test User"

    def test_stakeholder_organization_method(self) -> None:
        """Test stakeholder_organization admin method"""
        result = self.admin.stakeholder_organization(self.endorsement)
        assert result == "Test Org"

    def test_status_badge_method(self) -> None:
        """Test status_badge admin method"""
        result = self.admin.status_badge(self.endorsement)
        assert "pending" in result.lower()
        assert "background-color" in result

    def test_email_verified_badge_method(self) -> None:
        """Test email_verified_badge admin method"""
        # Unverified
        result = self.admin.email_verified_badge(self.endorsement)
        assert "✗ unverified" in result.lower()

        # Verified
        self.endorsement.email_verified = True
        self.endorsement.save()
        result = self.admin.email_verified_badge(self.endorsement)
        assert "✓ verified" in result.lower()

    def test_verification_link_method(self) -> None:
        """Test verification_link admin method"""
        result = self.admin.verification_link(self.endorsement)
        assert str(self.endorsement.verification_token) in result
        assert "verification link" in result.lower()

    def test_approve_endorsements_action(self) -> None:
        """Test approve_endorsements admin action"""
        request = HttpRequest()
        request.user = self.user
        # Mock messages framework for admin tests
        request._messages = Mock()

        queryset = Endorsement.objects.filter(id=self.endorsement.id)

        with patch.object(
            EndorsementEmailService,
            "send_confirmation_email",
        ) as mock_email:
            mock_email.return_value = True
            with patch.object(self.admin, "message_user") as mock_message:
                self.admin.approve_endorsements(request, queryset)

        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "approved"
        assert self.endorsement.reviewed_by == self.user
        assert self.endorsement.reviewed_at is not None
        mock_email.assert_called_once_with(self.endorsement)
        mock_message.assert_called_once()

    def test_reject_endorsements_action(self) -> None:
        """Test reject_endorsements admin action"""
        request = HttpRequest()
        request.user = self.user
        request._messages = Mock()

        queryset = Endorsement.objects.filter(id=self.endorsement.id)

        with patch.object(self.admin, "message_user") as mock_message:
            self.admin.reject_endorsements(request, queryset)

        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "rejected"
        assert self.endorsement.reviewed_by == self.user
        assert self.endorsement.reviewed_at is not None
        mock_message.assert_called_once()

    def test_mark_verified_action(self) -> None:
        """Test mark_verified admin action"""
        request = HttpRequest()
        request.user = self.user
        request._messages = Mock()

        queryset = Endorsement.objects.filter(id=self.endorsement.id)

        with patch.object(self.admin, "message_user") as mock_message:
            self.admin.mark_verified(request, queryset)

        self.endorsement.refresh_from_db()
        assert self.endorsement.email_verified is True
        assert self.endorsement.verified_at is not None
        mock_message.assert_called_once()

    def test_send_verification_emails_action(self) -> None:
        """Test send_verification_emails admin action"""
        request = HttpRequest()
        request.user = self.user
        request._messages = Mock()

        queryset = Endorsement.objects.filter(id=self.endorsement.id)

        with patch.object(
            EndorsementEmailService,
            "send_verification_email",
        ) as mock_email:
            mock_email.return_value = True
            with patch.object(self.admin, "message_user") as mock_message:
                self.admin.send_verification_emails(request, queryset)

        mock_email.assert_called_once_with(self.endorsement)
        mock_message.assert_called_once()

    def test_save_model_status_change_tracking(self) -> None:
        """Test save_model method tracks status changes"""
        request = HttpRequest()
        request.user = self.user

        # Mock form with changed_data
        form = Mock()
        form.changed_data = ["status"]

        self.admin.save_model(request, self.endorsement, form, change=True)

        assert self.endorsement.reviewed_by == self.user
        assert self.endorsement.reviewed_at is not None
