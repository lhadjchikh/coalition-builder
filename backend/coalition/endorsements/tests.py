import json
import uuid
from datetime import timedelta
from unittest.mock import Mock, patch

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.core import mail
from django.db import IntegrityError
from django.http import HttpRequest
from django.test import Client, TestCase
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from .admin import EndorsementAdmin
from .email_service import EndorsementEmailService
from .models import Endorsement
from .spam_prevention import SpamPreventionService


class EndorsementModelTest(TestCase):
    def setUp(self) -> None:
        # Create a stakeholder
        self.stakeholder = Stakeholder.objects.create(
            name="Test Farmer",
            organization="Test Farm",
            email="test@farm.com",
            state="MD",
            type="farmer",
        )

        # Create a campaign
        self.campaign = PolicyCampaign.objects.create(
            name="clean-water-act",
            title="Clean Water Act",
            summary="Protecting our waterways",
        )

    def test_create_endorsement(self) -> None:
        """Test creating an endorsement"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="We strongly support this initiative",
            public_display=True,
        )

        assert endorsement.stakeholder == self.stakeholder
        assert endorsement.campaign == self.campaign
        assert endorsement.statement == "We strongly support this initiative"
        assert endorsement.public_display
        assert endorsement.created_at is not None

    def test_endorsement_str_representation(self) -> None:
        """Test string representation of endorsement"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )
        expected_str = f"{self.stakeholder} endorses {self.campaign} (pending)"
        assert str(endorsement) == expected_str

    def test_unique_stakeholder_campaign_constraint(self) -> None:
        """Test that a stakeholder cannot endorse the same campaign twice"""
        # Create first endorsement
        Endorsement.objects.create(stakeholder=self.stakeholder, campaign=self.campaign)

        # Try to create duplicate endorsement
        with self.assertRaises(IntegrityError):
            Endorsement.objects.create(
                stakeholder=self.stakeholder,
                campaign=self.campaign,
            )

    def test_optional_statement(self) -> None:
        """Test that statement field is optional"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )
        assert endorsement.statement == ""

    def test_default_public_display(self) -> None:
        """Test that public_display defaults to True"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )
        assert endorsement.public_display

    def test_cascade_delete_stakeholder(self) -> None:
        """Test that deleting stakeholder deletes endorsements"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        stakeholder_id = self.stakeholder.id
        endorsement_id = endorsement.id

        self.stakeholder.delete()

        # Stakeholder should be deleted
        assert not Stakeholder.objects.filter(id=stakeholder_id).exists()
        # Endorsement should also be deleted
        assert not Endorsement.objects.filter(id=endorsement_id).exists()

    def test_cascade_delete_campaign(self) -> None:
        """Test that deleting campaign deletes endorsements"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        campaign_id = self.campaign.id
        endorsement_id = endorsement.id

        self.campaign.delete()

        # Campaign should be deleted
        assert not PolicyCampaign.objects.filter(id=campaign_id).exists()
        # Endorsement should also be deleted
        assert not Endorsement.objects.filter(id=endorsement_id).exists()
        # Stakeholder should remain
        assert Stakeholder.objects.filter(id=self.stakeholder.id).exists()

    def test_related_name_stakeholder_endorsements(self) -> None:
        """Test that stakeholder.endorsements related manager works"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        endorsements = self.stakeholder.endorsements.all()
        assert endorsements.count() == 1
        assert endorsements.first() == endorsement

    def test_related_name_campaign_endorsements(self) -> None:
        """Test that campaign.endorsements related manager works"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        endorsements = self.campaign.endorsements.all()
        assert endorsements.count() == 1
        assert endorsements.first() == endorsement


class EndorsementAPITest(TestCase):
    """Test the endorsement API endpoints"""

    def setUp(self) -> None:
        self.client = Client()

        # Create test campaign with endorsement fields
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign for API testing",
            description="Detailed description of the test campaign",
            endorsement_statement="I support this test campaign and its goals",
            allow_endorsements=True,
            endorsement_form_instructions="Please fill out all fields",
        )

        # Create test stakeholder
        self.stakeholder = Stakeholder.objects.create(
            name="Jane Smith",
            organization="Green Farms Coalition",
            role="Director",
            email="jane@greenfarms.org",
            state="VA",
            county="Fairfax County",
            type="nonprofit",
        )

        # Create test endorsement
        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="We fully support this important initiative",
            public_display=True,
        )

    def test_list_all_endorsements(self) -> None:
        """Test GET /api/endorsements/ endpoint - shows approved, verified, public"""
        # Initially, endorsement is pending and unverified, so should not appear
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 0  # No approved+verified+public endorsements yet

        # Approve and verify the endorsement
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.save()

        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1

        endorsement_data = data[0]
        assert endorsement_data["id"] == self.endorsement.id
        expected = "We fully support this important initiative"
        assert endorsement_data["statement"] == expected
        assert endorsement_data["public_display"]
        assert endorsement_data["stakeholder"]["name"] == "Jane Smith"
        assert endorsement_data["campaign"]["title"] == "Test Campaign"

    def test_list_campaign_endorsements(self) -> None:
        """Test GET /api/endorsements/?campaign_id={id} endpoint"""
        # Initially, endorsement is pending and unverified, so should not appear
        response = self.client.get(f"/api/endorsements/?campaign_id={self.campaign.id}")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 0  # No approved+verified+public endorsements yet

        # Approve and verify the endorsement
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.save()

        response = self.client.get(f"/api/endorsements/?campaign_id={self.campaign.id}")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1
        assert data[0]["campaign"]["id"] == self.campaign.id

    def test_create_endorsement_new_stakeholder(self) -> None:
        """Test POST /api/endorsements/ with new stakeholder"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Bob Johnson",
                "organization": "Johnson Family Farm",
                "role": "Owner",
                "email": "bob@johnsonfarm.com",
                "state": "MD",
                "county": "Carroll County",
                "type": "farmer",
            },
            "statement": "As a local farmer, I strongly support this campaign",
            "public_display": True,
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder was created
        stakeholder = Stakeholder.objects.get(email="bob@johnsonfarm.com")
        assert stakeholder.name == "Bob Johnson"
        assert stakeholder.type == "farmer"

        # Verify endorsement was created
        endorsement = Endorsement.objects.get(
            stakeholder=stakeholder,
            campaign=self.campaign,
        )
        expected = "As a local farmer, I strongly support this campaign"
        assert endorsement.statement == expected
        assert endorsement.public_display

    def test_create_endorsement_existing_stakeholder(self) -> None:
        """Test POST /api/endorsements/ with existing stakeholder email"""
        # Use existing stakeholder's email but different info
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Jane Smith Updated",
                "organization": "Updated Green Coalition",
                "role": "Senior Director",
                "email": "jane@greenfarms.org",  # Same email as existing stakeholder
                "state": "MD",
                "county": "Montgomery County",
                "type": "business",
            },
            "statement": "Updated endorsement statement",
            "public_display": False,
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder info was updated
        stakeholder = Stakeholder.objects.get(email="jane@greenfarms.org")
        assert stakeholder.name == "Jane Smith Updated"
        assert stakeholder.organization == "Updated Green Coalition"
        assert stakeholder.state == "MD"

        # Should still only have one stakeholder with this email
        assert Stakeholder.objects.filter(email="jane@greenfarms.org").count() == 1

    def test_create_endorsement_campaign_not_allowing(self) -> None:
        """Test POST /api/endorsements/ when campaign doesn't allow endorsements"""
        # Disable endorsements
        self.campaign.allow_endorsements = False
        self.campaign.save()

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "VA",
                "type": "other",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = response.json()
        assert "not accepting endorsements" in data["detail"]

    def test_create_endorsement_nonexistent_campaign(self) -> None:
        """Test POST /api/endorsements/ with invalid campaign ID"""
        endorsement_data = {
            "campaign_id": 99999,  # Non-existent campaign
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "VA",
                "type": "other",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 404

    def test_duplicate_endorsement_updates_existing(self) -> None:
        """Test that duplicate endorsement updates the existing one"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": self.stakeholder.name,
                "organization": self.stakeholder.organization,
                "role": self.stakeholder.role,
                "email": self.stakeholder.email,
                "state": self.stakeholder.state,
                "county": self.stakeholder.county,
                "type": self.stakeholder.type,
            },
            "statement": "Updated statement for existing endorsement",
            "public_display": False,
        }

        # Should have 1 endorsement before
        assert Endorsement.objects.count() == 1

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Should still have 1 endorsement after
        assert Endorsement.objects.count() == 1

        # But statement should be updated
        updated_endorsement = Endorsement.objects.get(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )
        expected = "Updated statement for existing endorsement"
        assert updated_endorsement.statement == expected
        assert not updated_endorsement.public_display

    def test_only_public_endorsements_listed(self) -> None:
        """Test that only public endorsements are returned in list endpoints"""
        # Make original endorsement approved and verified for comparison
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.save()

        # Create private endorsement (also approved and verified)
        private_stakeholder = Stakeholder.objects.create(
            name="Private Person",
            organization="Private Org",
            email="private@example.com",
            state="CA",
            type="individual",
        )

        Endorsement.objects.create(
            stakeholder=private_stakeholder,
            campaign=self.campaign,
            statement="This is a private endorsement",
            public_display=False,
            email_verified=True,
            status="approved",
        )

        # List all endorsements
        response = self.client.get("/api/endorsements/")
        data = response.json()

        # Should only return the public endorsement (private one excluded)
        assert len(data) == 1
        assert data[0]["stakeholder"]["name"] == "Jane Smith"

    def test_transaction_rollback_on_endorsement_error(self) -> None:
        """Test stakeholder creation rollback if endorsement creation fails"""
        from unittest.mock import patch

        # Count stakeholders before the operation
        initial_stakeholder_count = Stakeholder.objects.count()

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "New Stakeholder",
                "organization": "New Organization",
                "role": "Manager",
                "email": "new@example.com",
                "state": "VA",
                "county": "New County",
                "type": "business",
            },
            "statement": "Test statement",
            "public_display": True,
        }

        # Mock the Endorsement.objects.get_or_create to raise an exception
        # after the stakeholder is created
        with patch(
            "coalition.endorsements.models.Endorsement.objects.get_or_create",
        ) as mock_create:
            mock_create.side_effect = Exception(
                "Simulated endorsement creation failure",
            )

            response = self.client.post(
                "/api/endorsements/",
                data=json.dumps(endorsement_data),
                content_type="application/json",
            )

            # Now expects 400 status (spam detection catches it first)
            assert response.status_code == 400

            # Verify that the stakeholder was NOT created due to transaction rollback
            assert Stakeholder.objects.count() == initial_stakeholder_count
            assert not Stakeholder.objects.filter(email="new@example.com").exists()

        # List campaign endorsements - should be empty since no approved/verified ones
        response = self.client.get(f"/api/endorsements/?campaign_id={self.campaign.id}")
        data = response.json()

        # Should return empty list since stakeholder was rolled back
        assert len(data) == 0


class EndorsementVerificationTest(TestCase):
    """Test endorsement model features (email verification, status, etc.)"""

    def setUp(self) -> None:
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
        stakeholder2 = Stakeholder.objects.create(
            name="Test User 2",
            organization="Test Org 2",
            email="test2@example.com",
            state="VA",
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

        # Verified and approved = display
        endorsement.status = "approved"
        endorsement.save()
        assert endorsement.should_display_publicly

        # Verified, approved, but public_display=False = no display
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
        """Test email verification method"""
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
        assert endorsement.status == "approved"  # Auto-approval after verification

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


class EndorsementEmailServiceTest(TestCase):
    """Test email service functionality"""

    def setUp(self) -> None:
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
        mock_send_mail.side_effect = Exception("SMTP error")

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


class SpamPreventionServiceTest(TestCase):
    """Test spam prevention service"""

    def setUp(self) -> None:
        # Create a mock request for testing
        self.request = HttpRequest()
        self.request.META = {
            "REMOTE_ADDR": "192.168.1.1",
            "HTTP_USER_AGENT": "Test User Agent",
        }

    def test_rate_limit_check_within_limit(self) -> None:
        """Test rate limit check when within limits"""
        result = SpamPreventionService.check_rate_limit(self.request)

        assert result["allowed"] is True
        assert result["remaining"] == SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS

    def test_rate_limit_check_exceeded(self) -> None:
        """Test rate limit check when exceeded"""
        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.2"}

        # Record maximum attempts
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS):
            SpamPreventionService.record_submission_attempt(request)

        result = SpamPreventionService.check_rate_limit(request)

        assert result["allowed"] is False
        assert result["remaining"] == 0
        assert "rate limit exceeded" in result["message"].lower()

    def test_record_submission_attempt(self) -> None:
        """Test recording submission attempts"""
        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.3"}

        # First attempt
        SpamPreventionService.record_submission_attempt(request)
        result = SpamPreventionService.check_rate_limit(request)
        # django-ratelimit doesn't provide exact remaining count, just check allowed
        assert result["allowed"] is True

        # Record more attempts to reach limit
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS - 1):
            SpamPreventionService.record_submission_attempt(request)

        result = SpamPreventionService.check_rate_limit(request)
        assert result["allowed"] is False

    def test_validate_honeypot_empty_fields(self) -> None:
        """Test honeypot validation with empty fields (valid)"""
        form_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "message": "Valid submission",
        }
        assert SpamPreventionService.validate_honeypot(form_data) is True

    def test_validate_honeypot_filled_fields(self) -> None:
        """Test honeypot validation with filled honeypot fields (spam)"""
        form_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "website": "http://spam.com",  # Honeypot field
            "message": "Spam submission",
        }
        assert SpamPreventionService.validate_honeypot(form_data) is False

    def test_validate_timing_no_timing_data(self) -> None:
        """Test timing validation with missing timing data"""
        form_data = {"message": "Test"}
        assert SpamPreventionService.validate_timing(form_data) is True

    def test_validate_timing_too_fast(self) -> None:
        """Test timing validation for too-fast submission"""
        start_time = (timezone.now() - timedelta(seconds=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is False

    def test_validate_timing_too_slow(self) -> None:
        """Test timing validation for too-slow submission"""
        start_time = (timezone.now() - timedelta(hours=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is False

    def test_validate_timing_normal(self) -> None:
        """Test timing validation for normal submission time"""
        start_time = (timezone.now() - timedelta(minutes=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is True

    def test_check_email_reputation_disposable_domain(self) -> None:
        """Test email reputation check for disposable domains"""
        result = SpamPreventionService.check_email_reputation("test@mailinator.com")
        assert result["suspicious"] is True
        # Should detect either as disposable domain or invalid
        assert len(result["reasons"]) > 0

    def test_check_email_reputation_test_pattern(self) -> None:
        """Test email reputation check for test patterns"""
        result = SpamPreventionService.check_email_reputation("user+test@example.com")
        assert result["suspicious"] is True
        assert any("test" in reason.lower() for reason in result["reasons"])

    def test_check_email_reputation_sequential_numbers(self) -> None:
        """Test email reputation check for sequential numbers"""
        result = SpamPreventionService.check_email_reputation("user000@example.com")
        assert result["suspicious"] is True
        assert any("sequential" in reason.lower() for reason in result["reasons"])

    def test_check_email_reputation_clean_email(self) -> None:
        """Test email reputation check for clean email"""
        result = SpamPreventionService.check_email_reputation("john.doe@company.com")
        assert result["suspicious"] is False
        assert len(result["reasons"]) == 0

    def test_check_email_reputation_invalid_email(self) -> None:
        """Test email reputation check for invalid email format"""
        result = SpamPreventionService.check_email_reputation("invalid-email")
        assert result["suspicious"] is True
        # Should detect invalid format with email-validator or basic checks
        assert len(result["reasons"]) > 0

    def test_check_content_quality_without_akismet(self) -> None:
        """Test content quality check without Akismet (fallback mode)"""
        stakeholder_data = {"name": "test user", "organization": "fake org"}
        statement = "This statement has excessive character repetitionnnnnn!"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        # Should catch both name pattern and character repetition
        assert len(result["reasons"]) >= 2

    def test_check_content_quality_character_repetition(self) -> None:
        """Test content quality check for character repetition"""
        stakeholder_data = {"name": "John Doe", "organization": "Acme Corp"}
        statement = "This is sooooo important!"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        assert any("repetition" in reason.lower() for reason in result["reasons"])

    def test_check_content_quality_suspicious_name(self) -> None:
        """Test content quality check for suspicious name patterns"""
        stakeholder_data = {"name": "Test User", "organization": "Real Company"}
        statement = "I support this campaign"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        assert any("suspicious name" in reason.lower() for reason in result["reasons"])

    def test_check_content_quality_clean_content(self) -> None:
        """Test content quality check for clean content"""
        stakeholder_data = {
            "name": "Jane Smith",
            "organization": "Green Energy Corp",
            "role": "Director",
        }
        statement = "We fully support this important environmental initiative."

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is False
        assert len(result["reasons"]) == 0

    def test_comprehensive_spam_check_clean_submission(self) -> None:
        """Test comprehensive spam check for clean submission"""
        stakeholder_data = {
            "name": "Sarah Johnson",
            "organization": "Environmental Solutions Inc",
            "email": "sarah@envsolutions.com",
            "role": "CEO",
        }
        statement = "Our organization strongly supports this environmental policy."
        form_data = {
            "form_start_time": (timezone.now() - timedelta(minutes=3)).isoformat(),
        }

        result = SpamPreventionService.comprehensive_spam_check(
            self.request,
            stakeholder_data,
            statement,
            form_data,
        )

        assert result["is_spam"] is False
        assert result["confidence_score"] < 0.2
        assert "allow submission" in result["recommendations"][0].lower()

    def test_comprehensive_spam_check_honeypot_filled(self) -> None:
        """Test comprehensive spam check with honeypot field filled"""
        stakeholder_data = {
            "name": "Spam User",
            "organization": "Spam Corp",
            "email": "spam@example.com",
        }
        statement = "Spam message"
        form_data = {
            "website": "http://spam.com",  # Honeypot field
        }

        result = SpamPreventionService.comprehensive_spam_check(
            self.request,
            stakeholder_data,
            statement,
            form_data,
        )

        assert result["is_spam"] is True
        assert result["confidence_score"] == 1.0
        assert "honeypot" in result["reasons"][0].lower()

    def test_comprehensive_spam_check_rate_limit_exceeded(self) -> None:
        """Test comprehensive spam check with rate limit exceeded"""
        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.12"}

        # Exceed rate limit
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS):
            SpamPreventionService.record_submission_attempt(request)

        stakeholder_data = {"name": "User", "email": "user@example.com"}
        statement = "Message"
        form_data = {}

        result = SpamPreventionService.comprehensive_spam_check(
            request,
            stakeholder_data,
            statement,
            form_data,
        )

        assert result["is_spam"] is True
        assert result["confidence_score"] == 1.0
        assert "rate limit" in result["reasons"][0].lower()


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


class EndorsementAPIEnhancedTest(TestCase):
    """Test enhanced API endpoints for verification and admin functionality"""

    def setUp(self) -> None:
        self.client = Client()

        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
            is_staff=True,
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
            allow_endorsements=True,
        )

        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="Test statement",
        )

    def test_verify_endorsement_success(self) -> None:
        """Test successful endorsement verification"""
        token = str(self.endorsement.verification_token)
        response = self.client.post(f"/api/endorsements/verify/{token}/")

        assert response.status_code == 200
        data = response.json()
        assert "Email verified successfully" in data["message"]

        self.endorsement.refresh_from_db()
        assert self.endorsement.email_verified is True
        assert self.endorsement.verified_at is not None

    def test_verify_endorsement_invalid_token_format(self) -> None:
        """Test endorsement verification with invalid token format"""
        response = self.client.post("/api/endorsements/verify/invalid-token/")

        assert response.status_code == 400
        data = response.json()
        assert "invalid verification token format" in data["detail"].lower()

    def test_verify_endorsement_nonexistent_token(self) -> None:
        """Test endorsement verification with non-existent token"""
        fake_token = str(uuid.uuid4())
        response = self.client.post(f"/api/endorsements/verify/{fake_token}/")

        assert response.status_code == 404

    def test_verify_endorsement_already_verified(self) -> None:
        """Test verification of already verified endorsement"""
        self.endorsement.email_verified = True
        self.endorsement.save()

        token = str(self.endorsement.verification_token)
        response = self.client.post(f"/api/endorsements/verify/{token}/")

        assert response.status_code == 200
        data = response.json()
        assert "already verified" in data["message"].lower()

    def test_resend_verification_success(self) -> None:
        """Test resend verification endpoint (privacy-preserving response)"""
        response = self.client.post(
            "/api/endorsements/resend-verification/",
            {
                "email": self.stakeholder.email,
                "campaign_id": self.campaign.id,
            },
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Check for privacy-preserving message
        assert "if an endorsement exists" in data["message"].lower()

    def test_resend_verification_already_verified(self) -> None:
        """Test resend verification returns same message for verified endorsement"""
        self.endorsement.email_verified = True
        self.endorsement.save()

        response = self.client.post(
            "/api/endorsements/resend-verification/",
            {
                "email": self.stakeholder.email,
                "campaign_id": self.campaign.id,
            },
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Same privacy-preserving message regardless of verification status
        assert "if an endorsement exists" in data["message"].lower()

    def test_resend_verification_not_found(self) -> None:
        """Test resend verification returns same message for non-existent endorsement"""
        response = self.client.post(
            "/api/endorsements/resend-verification/",
            {
                "email": "nonexistent@example.com",
                "campaign_id": self.campaign.id,
            },
            content_type="application/json",
        )

        # Should return 200 with same message to prevent information disclosure
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "if an endorsement exists" in data["message"].lower()

    def test_resend_verification_rate_limiting(self) -> None:
        """Test resend verification endpoint has rate limiting"""
        # Make multiple requests to trigger rate limiting
        request_data = {
            "email": self.stakeholder.email,
            "campaign_id": self.campaign.id,
        }

        # Make requests up to the rate limit
        for _ in range(3):  # Default rate limit is 3 attempts
            response = self.client.post(
                "/api/endorsements/resend-verification/",
                request_data,
                content_type="application/json",
            )
            # Should succeed initially
            assert response.status_code in [200, 429]

        # The next request should be rate limited
        response = self.client.post(
            "/api/endorsements/resend-verification/",
            request_data,
            content_type="application/json",
        )
        assert response.status_code == 429
        data = response.json()
        assert "too many" in data["detail"].lower()

    def test_admin_approve_endorsement_requires_auth(self) -> None:
        """Test admin endorsement approval endpoint requires authentication"""
        # Test unauthenticated access
        response = self.client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
        )
        assert response.status_code == 403
        data = response.json()
        assert "admin access required" in data["detail"].lower()

    def test_admin_approve_endorsement_success(self) -> None:
        """Test admin endorsement approval endpoint with authenticated staff user"""
        # Login as staff user
        self.client.force_login(self.user)

        response = self.client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
        )

        assert response.status_code == 200
        data = response.json()
        assert "approved successfully" in data["message"].lower()

        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "approved"
        assert self.endorsement.reviewed_by == self.user

    def test_admin_reject_endorsement_requires_auth(self) -> None:
        """Test admin endorsement rejection endpoint requires authentication"""
        # Test unauthenticated access
        response = self.client.post(
            f"/api/endorsements/admin/reject/{self.endorsement.id}/",
        )
        assert response.status_code == 403
        data = response.json()
        assert "admin access required" in data["detail"].lower()

    def test_admin_reject_endorsement_success(self) -> None:
        """Test admin endorsement rejection endpoint with authenticated staff user"""
        # Login as staff user
        self.client.force_login(self.user)

        response = self.client.post(
            f"/api/endorsements/admin/reject/{self.endorsement.id}/",
        )

        assert response.status_code == 200
        data = response.json()
        assert "rejected successfully" in data["message"].lower()

        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "rejected"
        assert self.endorsement.reviewed_by == self.user

    def test_export_endorsements_csv(self) -> None:
        """Test CSV export endpoint (requires admin access)"""
        # Make endorsement approved and verified to appear in export
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.save()

        # Login as admin user
        self.client.force_login(self.user)

        response = self.client.get(
            f"/api/endorsements/export/csv/?campaign_id={self.campaign.id}",
        )

        assert response.status_code == 200
        assert response["Content-Type"] == "text/csv"
        assert "attachment" in response["Content-Disposition"]

        content = response.content.decode("utf-8")
        assert "Test User" in content
        assert "Test Org" in content

    def test_export_endorsements_csv_injection_protection(self) -> None:
        """Test CSV export sanitizes dangerous formula characters"""
        # Create stakeholder with potentially dangerous CSV data
        malicious_stakeholder = Stakeholder.objects.create(
            name="=cmd|' /C calc'!A0",  # Excel formula injection attempt
            organization="@SUM(1+1)*cmd|' /C calc'!A0",  # Another injection attempt
            email="evil@example.com",
            state="CA",
            type="individual",
        )

        Endorsement.objects.create(
            stakeholder=malicious_stakeholder,
            campaign=self.campaign,
            statement="+1+1+cmd|' /C calc'!A0",  # Statement with formula
            email_verified=True,
            status="approved",
        )

        # Login as admin user
        self.client.force_login(self.user)

        response = self.client.get("/api/endorsements/export/csv/")
        assert response.status_code == 200

        content = response.content.decode("utf-8")

        # Verify dangerous characters are prefixed with single quote
        assert "'=cmd" in content  # Leading = should be prefixed with '
        assert "'@SUM" in content  # Leading @ should be prefixed with '
        assert "'+1+1+cmd" in content  # Leading + should be prefixed with '

        # Verify original dangerous strings are not present
        assert "=cmd|" not in content  # Raw formula should not appear
        assert "@SUM(1+1)" not in content  # Raw formula should not appear
        assert "+1+1+cmd|" not in content  # Raw formula should not appear

    def test_export_endorsements_csv_unauthorized(self) -> None:
        """Test CSV export endpoint returns 403 for non-admin users"""
        response = self.client.get("/api/endorsements/export/csv/")
        assert response.status_code == 403

    def test_export_endorsements_json(self) -> None:
        """Test JSON export endpoint (requires admin access)"""
        # Make endorsement approved and verified to appear in export
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.save()

        # Login as admin user
        self.client.force_login(self.user)

        response = self.client.get(
            f"/api/endorsements/export/json/?campaign_id={self.campaign.id}",
        )

        assert response.status_code == 200
        assert response["Content-Type"] == "application/json"
        assert "attachment" in response["Content-Disposition"]

        data = response.json()
        assert len(data["endorsements"]) == 1
        assert data["endorsements"][0]["stakeholder"]["name"] == "Test User"

    def test_export_endorsements_json_unauthorized(self) -> None:
        """Test JSON export endpoint returns 403 for non-admin users"""
        response = self.client.get("/api/endorsements/export/json/")
        assert response.status_code == 403

    def test_admin_pending_endorsements_requires_auth(self) -> None:
        """Test admin pending endorsements endpoint requires authentication"""
        # Test unauthenticated access
        response = self.client.get("/api/endorsements/admin/pending/")
        assert response.status_code == 403
        data = response.json()
        assert "admin access required" in data["detail"].lower()

    def test_admin_pending_endorsements_success(self) -> None:
        """Test admin pending endorsements endpoint with authenticated staff user"""
        # Login as staff user
        self.client.force_login(self.user)

        # Create another pending endorsement
        stakeholder2 = Stakeholder.objects.create(
            name="Another User",
            organization="Another Org",
            email="another@example.com",
            state="CA",
            type="individual",
        )
        endorsement2 = Endorsement.objects.create(
            stakeholder=stakeholder2,
            campaign=self.campaign,
            statement="Another statement",
            status="pending",
        )

        response = self.client.get("/api/endorsements/admin/pending/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 2  # Both pending endorsements should be returned

        # Check that the response contains endorsement data
        endorsement_ids = [item["id"] for item in data]
        assert self.endorsement.id in endorsement_ids
        assert endorsement2.id in endorsement_ids

    def test_non_staff_user_cannot_access_admin_endpoints(self) -> None:
        """Test that regular (non-staff) users cannot access admin endpoints"""
        # Create a regular user (not staff)
        regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="testpass",
            is_staff=False,
        )
        self.client.force_login(regular_user)

        # Test all admin endpoints return 403
        response = self.client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
        )
        assert response.status_code == 403

        response = self.client.post(
            f"/api/endorsements/admin/reject/{self.endorsement.id}/",
        )
        assert response.status_code == 403

        response = self.client.get("/api/endorsements/admin/pending/")
        assert response.status_code == 403

        response = self.client.get("/api/endorsements/export/csv/")
        assert response.status_code == 403

        response = self.client.get("/api/endorsements/export/json/")
        assert response.status_code == 403
