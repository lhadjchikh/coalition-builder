"""
Tests for endorsement email service functionality.
"""

from datetime import UTC, datetime, timedelta
from smtplib import SMTPException
from unittest.mock import Mock, patch

from botocore.exceptions import ClientError
from django.core import mail
from django.core.exceptions import ImproperlyConfigured
from django.db import OperationalError
from django.template.exceptions import TemplateDoesNotExist
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign
from coalition.content.models import HomePage
from coalition.core.models import SiteConfiguration
from coalition.test_base import BaseTestCase

from ..email_service import EndorsementEmailService
from ..models import Endorsement


class EndorsementEmailServiceTest(BaseTestCase):
    """Test email service functionality"""

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
    def test_timestamp_is_persisted_before_verification_email_is_sent(
        self,
        mock_send_mail: Mock,
    ) -> None:
        with (
            patch.object(
                self.endorsement,
                "save",
                side_effect=OperationalError("database unavailable"),
            ),
            self.assertRaises(OperationalError),
        ):
            EndorsementEmailService.send_verification_email(self.endorsement)

        mock_send_mail.assert_not_called()

    @patch("coalition.endorsements.email_service.send_mail")
    def test_failed_resend_preserves_previous_sent_timestamp(
        self,
        mock_send_mail: Mock,
    ) -> None:
        mock_send_mail.return_value = 1
        EndorsementEmailService.send_verification_email(self.endorsement)
        self.endorsement.refresh_from_db()
        previous_sent_at = self.endorsement.verification_sent_at

        mock_send_mail.return_value = 0
        sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is False
        self.endorsement.refresh_from_db()
        assert self.endorsement.verification_sent_at == previous_sent_at

    def test_failed_resend_does_not_overwrite_newer_concurrent_timestamp(
        self,
    ) -> None:
        previous_sent_at = timezone.now() - timedelta(hours=1)
        newer_sent_at = timezone.now() + timedelta(seconds=1)
        self.endorsement.verification_sent_at = previous_sent_at
        self.endorsement.save(update_fields=["verification_sent_at"])

        def record_concurrent_success(_email: object) -> bool:
            Endorsement.objects.filter(pk=self.endorsement.pk).update(
                verification_sent_at=newer_sent_at,
            )
            return False

        with patch(
            "coalition.endorsements.email_service._deliver",
            side_effect=record_concurrent_success,
        ):
            sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is False
        self.endorsement.refresh_from_db()
        assert self.endorsement.verification_sent_at == newer_sent_at

    def test_verification_email_uses_active_homepage_organization_name(self) -> None:
        HomePage.objects.create(
            organization_name="Land and Bay Stewards",
            tagline="Stewarding land and bay",
            hero_title="Land and Bay Stewards",
        )
        mail.outbox = []

        with self.settings(ORGANIZATION_NAME="Coalition Builder"):
            sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is True
        assert "Land and Bay Stewards" in mail.outbox[0].body
        assert "Coalition Builder" not in mail.outbox[0].body

    def test_verification_email_uses_configured_name_without_homepage(self) -> None:
        HomePage.objects.all().delete()
        mail.outbox = []

        with self.settings(ORGANIZATION_NAME="Configured Organization"):
            sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is True
        assert "Configured Organization" in mail.outbox[0].body

    @patch(
        "coalition.endorsements.email_service.HomePage.get_active",
        side_effect=OperationalError("homepage lookup failed"),
    )
    def test_homepage_lookup_failure_prevents_wrong_brand_email(
        self,
        mock_get_active: Mock,
    ) -> None:
        mail.outbox = []

        with self.assertLogs(
            "coalition.endorsements.email_service",
            level="ERROR",
        ) as captured:
            sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is False
        assert mail.outbox == []
        assert "EMAIL_DELIVERY_FAILED" in captured.output[0]
        mock_get_active.assert_called_once_with()

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

    def test_admin_notification_uses_site_timezone(self) -> None:
        submitted_at = datetime(2026, 1, 15, 20, 30, tzinfo=UTC)
        Endorsement.objects.filter(pk=self.endorsement.pk).update(
            created_at=submitted_at,
        )
        self.endorsement.refresh_from_db()
        SiteConfiguration.objects.create(timezone="America/Los_Angeles")
        mail.outbox = []

        with self.settings(ADMIN_NOTIFICATION_EMAILS=["admin@example.com"]):
            sent = EndorsementEmailService.send_admin_notification(self.endorsement)

        assert sent is True
        assert "Submitted: January 15, 2026 12:30 PM" in mail.outbox[0].body
        html_message = mail.outbox[0].alternatives[0]
        assert html_message.mimetype == "text/html"
        assert "January 15, 2026 12:30 PM" in html_message.content
        assert self.endorsement.created_at == submitted_at

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

        with self.settings(SITE_URL="https://example.test"):
            result = EndorsementEmailService.send_confirmation_email(self.endorsement)

        assert result is True
        assert len(mail.outbox) == 1

        email = mail.outbox[0]
        assert "has been approved" in email.subject.lower()
        assert self.stakeholder.email in email.to
        assert f"https://example.test/campaigns/{self.campaign.name}/" in email.body


def ses_rejection() -> ClientError:
    """The error the SES API raises for an unverified or rejected recipient."""
    return ClientError(
        {"Error": {"Code": "MessageRejected", "Message": "not verified"}},
        "SendEmail",
    )


class EndorsementEmailFailureContainmentTest(BaseTestCase):
    """Email transport failures must be reported, not propagated.

    ``create_endorsement`` sends these emails inside ``transaction.atomic``.
    An exception escaping the service would roll back the stakeholder and
    endorsement the user just submitted, so a broken mail path would silently
    destroy their submission. The service therefore converts every transport
    failure into ``False`` plus a logged error.
    """

    def setUp(self) -> None:
        super().setUp()
        self.stakeholder = self.create_stakeholder(email="test@example.com")
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

    @patch("coalition.endorsements.email_service.send_mail")
    def test_verification_email_contains_ses_rejection(
        self,
        mock_send_mail: Mock,
    ) -> None:
        mock_send_mail.side_effect = ses_rejection()

        sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is False

    @patch("coalition.endorsements.email_service.send_mail")
    def test_verification_email_contains_misconfiguration(
        self,
        mock_send_mail: Mock,
    ) -> None:
        mock_send_mail.side_effect = ImproperlyConfigured("EMAIL_HOST missing")

        sent = EndorsementEmailService.send_verification_email(self.endorsement)

        assert sent is False

    @patch("coalition.endorsements.email_service.send_mail")
    def test_admin_notification_contains_ses_rejection(
        self,
        mock_send_mail: Mock,
    ) -> None:
        mock_send_mail.side_effect = ses_rejection()

        with self.settings(ADMIN_NOTIFICATION_EMAILS=["admin@example.com"]):
            result = EndorsementEmailService.send_admin_notification(self.endorsement)

        assert result is False

    @patch("coalition.endorsements.email_service.send_mail")
    @patch(
        "coalition.endorsements.email_service.SiteConfiguration.get_timezone",
        side_effect=OperationalError("site configuration unavailable"),
    )
    def test_admin_timezone_lookup_failure_is_contained(
        self,
        mock_get_timezone: Mock,
        mock_send_mail: Mock,
    ) -> None:
        with self.settings(ADMIN_NOTIFICATION_EMAILS=["admin@example.com"]):
            sent = EndorsementEmailService.send_admin_notification(self.endorsement)

        assert sent is False
        mock_get_timezone.assert_called_once_with()
        mock_send_mail.assert_not_called()

    @patch("coalition.endorsements.email_service.send_mail")
    def test_confirmation_email_contains_ses_rejection(
        self,
        mock_send_mail: Mock,
    ) -> None:
        mock_send_mail.side_effect = ses_rejection()

        sent = EndorsementEmailService.send_confirmation_email(self.endorsement)

        assert sent is False

    @patch("coalition.endorsements.email_service.send_mail")
    def test_failure_is_logged_with_traceback_and_recipient(
        self,
        mock_send_mail: Mock,
    ) -> None:
        """Containment only stays safe if the failure is loud in the logs."""
        mock_send_mail.side_effect = ses_rejection()

        with self.assertLogs(
            "coalition.endorsements.email_service",
            level="ERROR",
        ) as captured:
            EndorsementEmailService.send_verification_email(self.endorsement)

        record = captured.records[0]
        assert record.exc_info is not None, "expected traceback for alarm triage"
        assert str(self.endorsement.id) in record.getMessage()

    @patch("coalition.endorsements.email_service.send_mail")
    def test_failed_verification_does_not_record_a_sent_timestamp(
        self,
        mock_send_mail: Mock,
    ) -> None:
        """A resend must remain possible after a failure."""
        mock_send_mail.side_effect = ses_rejection()

        EndorsementEmailService.send_verification_email(self.endorsement)

        self.endorsement.refresh_from_db()
        assert self.endorsement.verification_sent_at is None
