"""
Tests for endorsement API endpoints.
"""

import json
import uuid
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import Client

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.legal.models import LegalDocument, TermsAcceptance
from coalition.stakeholders.models import Stakeholder
from coalition.test_base import BaseTestCase


def get_valid_form_metadata() -> dict[str, str]:
    """Return valid form metadata for testing"""
    return {
        "timestamp": "2024-01-01T10:00:00Z",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "referrer": "https://example.com/campaign-page",
        "ip_address": "192.168.1.100",
        "session_id": "test-session-123",
    }


class EndorsementAPITest(BaseTestCase):
    """Test basic endorsement API endpoints"""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()  # Clear rate limiting cache between tests
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

        # Create test stakeholder using helper
        self.stakeholder = self.create_stakeholder(
            first_name="Jane",
            last_name="Smith",
            organization="Green Farms Coalition",
            role="Director",
            email="jane@greenfarms.org",
            street_address="123 Green St",
            city="Alexandria",
            state=self.virginia,  # Use Region object from fixture
            zip_code="22301",
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
        self.endorsement.display_publicly = True
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
        assert endorsement_data["stakeholder"]["first_name"] == "Jane"
        assert endorsement_data["stakeholder"]["last_name"] == "Smith"
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
        self.endorsement.display_publicly = True
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
                "first_name": "Bob",
                "last_name": "Johnson",
                "organization": "Johnson Family Farm",
                "role": "Owner",
                "email": "bob@johnsonfarm.com",
                "street_address": "123 Farm Road",
                "city": "Westminster",
                "state": "MD",
                "zip_code": "21157",
                "county": "Carroll County",
                "type": "farmer",
            },
            "statement": "As a local farmer, I strongly support this campaign",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder was created
        stakeholder = Stakeholder.objects.get(email="bob@johnsonfarm.com")
        assert stakeholder.first_name == "Bob"
        assert stakeholder.last_name == "Johnson"
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
        # Use existing stakeholder's email with EXACT matching info (security)
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Jane",
                "last_name": "Smith",  # Exact match
                "organization": "Green Farms Coalition",  # Exact match
                "role": "Director",  # Exact match
                "email": "jane@greenfarms.org",  # Same email as existing stakeholder
                "street_address": "123 Green St",  # Exact match
                "city": "Alexandria",  # Exact match
                "state": "VA",  # Exact match
                "zip_code": "22301",  # Exact match
                "county": "Fairfax County",  # Exact match
                "type": "nonprofit",  # Exact match
            },
            "statement": "Updated endorsement statement",
            "public_display": False,
            "terms_accepted": True,
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder info was NOT changed (security requirement)
        stakeholder = Stakeholder.objects.get(email="jane@greenfarms.org")
        assert stakeholder.first_name == "Jane"
        assert stakeholder.last_name == "Smith"  # Original data preserved
        assert (
            stakeholder.organization == "Green Farms Coalition"
        )  # Original data preserved
        assert stakeholder.state.abbrev == "VA"  # Original data preserved

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
                "first_name": "Test",
                "last_name": "User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "other",
            },
            "terms_accepted": True,
            "org_authorized": True,  # Test Org authorization
            "form_metadata": get_valid_form_metadata(),
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
                "first_name": "Test",
                "last_name": "User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "other",
            },
            "terms_accepted": True,
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
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
                "first_name": self.stakeholder.first_name,
                "last_name": self.stakeholder.last_name,
                "organization": self.stakeholder.organization,
                "role": self.stakeholder.role,
                "email": self.stakeholder.email,
                "street_address": self.stakeholder.street_address,
                "city": self.stakeholder.city,
                "state": self.stakeholder.state,
                "zip_code": self.stakeholder.zip_code,
                "county": self.stakeholder.county,
                "type": self.stakeholder.type,
            },
            "statement": "Updated statement for existing endorsement",
            "public_display": False,
            "terms_accepted": True,
            "org_authorized": True,  # Organization endorsement
            "form_metadata": get_valid_form_metadata(),
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
        self.endorsement.display_publicly = True
        self.endorsement.save()

        # Create private endorsement (also approved and verified)
        private_stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="Person",
            organization="Private Org",
            email="private@example.com",
            state=self.california,  # Use Region object from fixture
            type="individual",
        )

        Endorsement.objects.create(
            stakeholder=private_stakeholder,
            campaign=self.campaign,
            statement="This is a private endorsement",
            public_display=False,
            email_verified=True,
            status="approved",
            display_publicly=True,
        )

        # List all endorsements
        response = self.client.get("/api/endorsements/")
        data = response.json()

        # Should only return the public endorsement (private one excluded)
        assert len(data) == 1
        assert data[0]["stakeholder"]["first_name"] == "Jane"
        assert data[0]["stakeholder"]["last_name"] == "Smith"

    def test_transaction_rollback_on_endorsement_error(self) -> None:
        """Test stakeholder creation rollback if endorsement creation fails"""
        # Count stakeholders before the operation
        initial_stakeholder_count = Stakeholder.objects.count()

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "New",
                "last_name": "Stakeholder",
                "organization": "New Organization",
                "role": "Manager",
                "email": "new@example.com",
                "street_address": "456 Business Ave",
                "city": "Norfolk",
                "state": "VA",
                "zip_code": "23510",
                "county": "New County",
                "type": "business",
            },
            "statement": "Test statement",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": True,  # New Organization authorization
            "form_metadata": get_valid_form_metadata(),
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

            # Should return 500 status for internal server error (simulated failure)
            assert response.status_code == 500

            # Verify that the stakeholder was NOT created due to transaction rollback
            assert Stakeholder.objects.count() == initial_stakeholder_count
            assert not Stakeholder.objects.filter(email="new@example.com").exists()


class EndorsementAPIEnhancedTest(BaseTestCase):
    """Test enhanced API endpoints for verification and admin functionality"""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()  # Clear rate limiting cache between tests
        self.client = Client()

        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
            is_staff=True,
        )

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

        # Make 4 requests - first 3 should succeed, 4th should be rate limited
        # (record-then-check pattern: 4th request records to 4, then checks limit)
        responses = []
        for _i in range(4):
            # Set consistent IP for rate limiting to work
            response = self.client.post(
                "/api/endorsements/resend-verification/",
                request_data,
                content_type="application/json",
                REMOTE_ADDR="127.0.0.1",  # Ensure consistent IP
            )
            responses.append(response)

        # First 3 should succeed
        for i in range(3):
            assert (
                responses[i].status_code == 200
            ), f"Request {i + 1} should succeed but got {responses[i].status_code}"

        # 4th request should be rate limited
        assert (
            responses[3].status_code == 429
        ), f"Request 4 should be rate limited but got {responses[3].status_code}"
        data = responses[3].json()
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
        self.endorsement.display_publicly = True
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
        malicious_stakeholder = self.create_stakeholder(
            first_name="=cmd|' /C calc'!A0",  # Excel formula injection attempt
            last_name="User",
            organization="@SUM(1+1)*cmd|' /C calc'!A0",  # Another injection attempt
            email="evil@example.com",
            state=self.california,  # Use Region object from fixture
            type="individual",
        )

        Endorsement.objects.create(
            stakeholder=malicious_stakeholder,
            campaign=self.campaign,
            statement="+1+1+cmd|' /C calc'!A0",  # Statement with formula
            email_verified=True,
            status="approved",
            display_publicly=True,
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

        # Verify original dangerous strings are not present (should be prefixed with ')
        assert "=cmd|" not in content or "'=cmd|" in content  # Should be sanitized
        assert (
            "@SUM(1+1)" not in content or "'@SUM(1+1)" in content
        )  # Should be sanitized
        assert (
            "+1+1+cmd|" not in content or "'+1+1+cmd|" in content
        )  # Should be sanitized

    def test_export_endorsements_csv_unauthorized(self) -> None:
        """Test CSV export endpoint returns 403 for non-admin users"""
        response = self.client.get("/api/endorsements/export/csv/")
        assert response.status_code == 403

    def test_export_endorsements_json(self) -> None:
        """Test JSON export endpoint (requires admin access)"""
        # Make endorsement approved and verified to appear in export
        self.endorsement.email_verified = True
        self.endorsement.status = "approved"
        self.endorsement.display_publicly = True
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
        assert data["endorsements"][0]["stakeholder"]["first_name"] == "Test"
        assert data["endorsements"][0]["stakeholder"]["last_name"] == "User"

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
        stakeholder2 = self.create_stakeholder(
            first_name="Test",
            last_name="User",
            organization="Another Org",
            email="another@example.com",
            state=self.california,  # Use Region object from fixture
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


class TermsAcceptanceIntegrationTest(BaseTestCase):
    """Test automatic creation of TermsAcceptance records during endorsement."""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()  # Clear rate limiting cache between tests
        self.client = Client()

        # Create admin user for legal documents
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass",
        )

        # Create test campaign
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign",
            description="Test description",
            endorsement_statement="I support this test campaign",
            allow_endorsements=True,
            endorsement_form_instructions="Please fill out all fields",
        )

        # Create active terms document
        self.terms_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<p>Terms content</p>",
            version="1.0",
            is_active=True,
            created_by=self.admin_user,
        )

    def test_terms_acceptance_created_with_new_endorsement(self) -> None:
        """Test TermsAcceptance creation when endorsement with terms_accepted=True."""
        # Verify no TermsAcceptance records exist initially
        assert TermsAcceptance.objects.count() == 0

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "John",
                "last_name": "Doe",
                "organization": "Test Org",
                "role": "Manager",
                "email": "john@test.com",
                "street_address": "123 Test St",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "business",
            },
            "statement": "I support this campaign",
            "public_display": True,
            "terms_accepted": True,  # This should trigger TermsAcceptance creation
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
            HTTP_USER_AGENT="Test Browser v1.0",
            REMOTE_ADDR="192.168.1.100",
        )

        assert (
            response.status_code == 200
        )  # API returns 200 for successful endorsement creation

        # Verify endorsement was created
        endorsements = Endorsement.objects.all()
        assert len(endorsements) == 1
        endorsement = endorsements[0]
        assert endorsement.terms_accepted is True

        # Verify TermsAcceptance record was automatically created
        terms_acceptances = TermsAcceptance.objects.all()
        assert len(terms_acceptances) == 1

        acceptance = terms_acceptances[0]
        assert acceptance.endorsement == endorsement
        assert acceptance.legal_document == self.terms_doc
        assert acceptance.ip_address == "192.168.1.100"
        assert acceptance.user_agent == "Test Browser v1.0"
        assert acceptance.accepted_at is not None

    def test_no_terms_acceptance_when_terms_not_accepted(self) -> None:
        """Test that TermsAcceptance is NOT created when terms_accepted=False"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Jane",
                "last_name": "Doe",
                "organization": "Test Org 2",
                "role": "Director",
                "email": "jane@test.com",
                "street_address": "456 Test Ave",
                "city": "Arlington",
                "state": "VA",
                "zip_code": "22201",
                "type": "nonprofit",
            },
            "statement": "I support this campaign",
            "public_display": True,
            "terms_accepted": False,  # Should not create TermsAcceptance
            "org_authorized": True,
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
            HTTP_USER_AGENT="Test Browser v1.0",
            REMOTE_ADDR="192.168.1.100",
        )

        # Should fail because terms_accepted is required
        assert response.status_code == 400
        assert "Terms of use must be accepted" in response.json()["detail"]

        # Verify no endorsement or TermsAcceptance was created
        assert Endorsement.objects.count() == 0
        assert TermsAcceptance.objects.count() == 0

    def test_no_terms_acceptance_when_no_active_terms_document(self) -> None:
        """Test graceful handling when no active terms document exists"""
        # Deactivate the terms document
        self.terms_doc.is_active = False
        self.terms_doc.save()

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Bob",
                "last_name": "Smith",
                "organization": "Test Org 3",
                "email": "bob@test.com",
                "street_address": "789 Test Way",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
                "type": "individual",
            },
            "statement": "I support this campaign",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
            HTTP_USER_AGENT="Test Browser v1.0",
            REMOTE_ADDR="192.168.1.100",
        )

        assert response.status_code == 200

        # Verify endorsement was created but no TermsAcceptance (no active terms doc)
        assert Endorsement.objects.count() == 1
        assert TermsAcceptance.objects.count() == 0

        endorsement = Endorsement.objects.first()
        assert endorsement.terms_accepted is True  # Still marked as accepted

    def test_terms_acceptance_with_existing_stakeholder(self) -> None:
        """Test TermsAcceptance creation when using existing stakeholder"""
        # Create an existing stakeholder
        existing_stakeholder = self.create_stakeholder(
            first_name="Existing",
            last_name="User",
            organization="Existing Org",
            email="existing@test.com",
            street_address="456 Existing St",
            city="Norfolk",
            state=self.virginia,  # Use Region object from fixture
            zip_code="23510",
            type="business",
        )

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Existing",
                "last_name": "User",  # Exact match for security
                "organization": "Existing Org",
                "email": "existing@test.com",
                "street_address": "456 Existing St",
                "city": "Norfolk",
                "state": "VA",
                "zip_code": "23510",
                "type": "business",
            },
            "statement": "I endorse this campaign",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": True,  # Required since organization is provided
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
            HTTP_USER_AGENT="Mozilla/5.0 (Test)",
            REMOTE_ADDR="10.0.0.1",
        )

        assert response.status_code == 200

        # Should still only have one stakeholder
        assert Stakeholder.objects.count() == 1

        # Verify TermsAcceptance was created for the existing stakeholder
        assert TermsAcceptance.objects.count() == 1
        acceptance = TermsAcceptance.objects.first()
        assert acceptance.endorsement.stakeholder == existing_stakeholder
        assert acceptance.ip_address == "10.0.0.1"
        assert acceptance.user_agent == "Mozilla/5.0 (Test)"
