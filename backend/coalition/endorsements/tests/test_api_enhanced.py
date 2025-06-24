import uuid

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder


class EndorsementAPIEnhancedTest(TestCase):
    """Test enhanced API endpoints for verification and admin functionality"""

    def setUp(self) -> None:
        cache.clear()  # Clear rate limiting cache between tests
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
            ), f"Request {i+1} should succeed but got {responses[i].status_code}"

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
