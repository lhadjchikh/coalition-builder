"""
Test CSRF protection on admin endpoints.
"""

from django.contrib.auth.models import User
from django.test import Client

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.test_base import BaseTestCase


class AdminCSRFProtectionTest(BaseTestCase):
    """Test that admin endpoints are protected against CSRF attacks."""

    def setUp(self) -> None:
        super().setUp()
        self.client = Client(enforce_csrf_checks=True)  # Enable CSRF checks

        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
            is_staff=True,
        )

        # Create test data
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            allow_endorsements=True,
        )

        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="User",
            organization="Test Org",
            email="test@example.com",
            type="individual",
        )

        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="Test statement",
            status="pending",
        )

    def test_admin_approve_requires_csrf_token(self) -> None:
        """Test that admin approve endpoint requires CSRF token."""
        # Login as admin
        self.client.login(username="admin", password="testpass")

        # Try to approve without CSRF token
        response = self.client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
            content_type="application/json",
        )

        # Should fail with CSRF error
        assert response.status_code == 403
        assert "CSRF" in response.content.decode()

        # Endorsement should still be pending
        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "pending"

    def test_admin_reject_requires_csrf_token(self) -> None:
        """Test that admin reject endpoint requires CSRF token."""
        # Login as admin
        self.client.login(username="admin", password="testpass")

        # Try to reject without CSRF token
        response = self.client.post(
            f"/api/endorsements/admin/reject/{self.endorsement.id}/",
            content_type="application/json",
        )

        # Should fail with CSRF error
        assert response.status_code == 403
        assert "CSRF" in response.content.decode()

        # Endorsement should still be pending
        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "pending"

    def test_all_post_endpoints_require_csrf(self) -> None:
        """Test that all POST endpoints require CSRF token."""
        # Create endorsement without CSRF token
        response = self.client.post(
            "/api/endorsements/",
            data={
                "campaign_id": self.campaign.id,
                "stakeholder": {
                    "name": "New User",
                    "organization": "New Org",
                    "email": "new@example.com",
                    "state": "MD",
                    "type": "individual",
                },
                "statement": "Test statement",
                "terms_accepted": True,
                "form_metadata": {
                    "form_start_time": "2024-01-01T00:00:00Z",
                    "website": "",
                    "url": "",
                    "homepage": "",
                    "confirm_email": "",
                },
            },
            content_type="application/json",
        )

        # Should fail without CSRF token
        assert response.status_code == 403
        assert "CSRF" in response.content.decode()

        # Verify endpoint without CSRF token
        response = self.client.post(
            f"/api/endorsements/verify/{self.endorsement.verification_token}/",
            content_type="application/json",
        )
        assert response.status_code == 403

        # Resend verification without CSRF token
        response = self.client.post(
            "/api/endorsements/resend-verification/",
            data={
                "email": "test@example.com",
                "campaign_id": self.campaign.id,
            },
            content_type="application/json",
        )
        assert response.status_code == 403

    def test_get_endpoints_work_without_csrf(self) -> None:
        """Test that GET endpoints don't require CSRF token."""
        # List endorsements without CSRF token (GET request)
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200
