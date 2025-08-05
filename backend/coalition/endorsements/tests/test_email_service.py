"""
Tests for endorsement email service functionality.
"""

from smtplib import SMTPException
from unittest.mock import Mock, patch

from django.core import mail
from django.template.exceptions import TemplateDoesNotExist
from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from ..email_service import EndorsementEmailService
from ..models import Endorsement


class EndorsementEmailServiceTest(TestCase):
    """Test email service functionality"""

    def setUp(self) -> None:
        self.stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="User",
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

    def test_send_verification_email_success(self) -> None:
        """Test successful verification email sending"""
        # Clear any existing emails
        mail.outbox = []

        result = EndorsementEmailService.send_verification_email(self.endorsement)

        assert result is True
        assert len(mail.outbox) == 1

        email = mail.outbox[0]
        assert "verify your endorsement" in email.subject.lower()
        assert self.stakeholder.email in email.to
        assert str(self.endorsement.verification_token) in email.body

        # Check that timestamp was updated
        self.endorsement.refresh_from_db()
        assert self.endorsement.verification_sent_at is not None

    @patch("coalition.endorsements.email_service.send_mail")
    def test_send_verification_email_failure(self, mock_send_mail: Mock) -> None:
        """Test verification email sending failure"""
        mock_send_mail.return_value = False

        result = EndorsementEmailService.send_verification_email(self.endorsement)

        assert result is False
        mock_send_mail.assert_called_once()

    @patch("coalition.endorsements.email_service.send_mail")
    def test_send_verification_email_exception(self, mock_send_mail: Mock) -> None:
        """Test verification email sending with exception"""
        mock_send_mail.side_effect = SMTPException("SMTP error")

        result = EndorsementEmailService.send_verification_email(self.endorsement)

        assert result is False

    @patch("coalition.endorsements.email_service.render_to_string")
    def test_send_verification_email_template_error(self, mock_render: Mock) -> None:
        """Test verification email sending with template error"""
        mock_render.side_effect = TemplateDoesNotExist("Template not found")

        result = EndorsementEmailService.send_verification_email(self.endorsement)

        assert result is False

    def test_send_admin_notification_success(self) -> None:
        """Test successful admin notification"""
        with self.settings(
            ADMIN_NOTIFICATION_EMAILS=["admin1@example.com", "admin2@example.com"],
        ):
            mail.outbox = []

            result = EndorsementEmailService.send_admin_notification(self.endorsement)

            assert result is True
            assert len(mail.outbox) == 1

            email = mail.outbox[0]
            assert "new endorsement requires review" in email.subject.lower()
            assert "admin1@example.com" in email.to
            assert "admin2@example.com" in email.to

    def test_send_admin_notification_no_admins_configured(self) -> None:
        """Test admin notification when no admins configured"""
        with self.settings(ADMIN_NOTIFICATION_EMAILS=[]):
            result = EndorsementEmailService.send_admin_notification(self.endorsement)
            assert result is False

    def test_send_confirmation_email_success(self) -> None:
        """Test successful approval confirmation email"""
        mail.outbox = []
        self.endorsement.status = "approved"
        self.endorsement.save()

        result = EndorsementEmailService.send_confirmation_email(self.endorsement)

        assert result is True
        assert len(mail.outbox) == 1

        email = mail.outbox[0]
        assert "has been approved" in email.subject.lower()
        assert self.stakeholder.email in email.to
