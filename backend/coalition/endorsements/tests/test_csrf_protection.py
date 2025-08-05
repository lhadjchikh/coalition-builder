"""
Test CSRF protection for endorsement admin endpoints.
"""

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.test.utils import override_settings

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from ..models import Endorsement


class CSRFProtectionTest(TestCase):
    """Test CSRF protection for admin endpoints"""

    def setUp(self) -> None:
        self.client = Client(enforce_csrf_checks=True)

        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
            is_staff=True,
        )

        # Create test data
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
            allow_endorsements=True,
        )

        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="Test statement",
            email_verified=True,
            status="verified",
        )

    @override_settings(DEBUG=False)  # Ensure CSRF is enforced
    def test_admin_approve_requires_csrf_token(self) -> None:
        """Test that admin approve endpoint requires CSRF token"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Try to approve without CSRF token (should fail)
        response = self.client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
            content_type="application/json",
        )

        # Should get CSRF failure
        assert response.status_code == 403

        # Endorsement should not be approved
        self.endorsement.refresh_from_db()
        assert self.endorsement.status != "approved"

    @override_settings(DEBUG=False)
    def test_admin_reject_requires_csrf_token(self) -> None:
        """Test that admin reject endpoint requires CSRF token"""
        # Login as admin
        self.client.force_login(self.admin_user)

        # Try to reject without CSRF token (should fail)
        response = self.client.post(
            f"/api/endorsements/admin/reject/{self.endorsement.id}/",
            content_type="application/json",
        )

        # Should get CSRF failure
        assert response.status_code == 403

        # Endorsement should not be rejected
        self.endorsement.refresh_from_db()
        assert self.endorsement.status != "rejected"

    def test_admin_approve_works_with_csrf_exempt_client(self) -> None:
        """Test that admin approve works with Django test client (CSRF exempt)"""
        # Use regular client (not enforce_csrf_checks) for this test
        client = Client()
        client.force_login(self.admin_user)

        # Try to approve (should succeed with regular test client)
        response = client.post(
            f"/api/endorsements/admin/approve/{self.endorsement.id}/",
            content_type="application/json",
        )

        # Should succeed
        assert response.status_code == 200

        # Endorsement should be approved
        self.endorsement.refresh_from_db()
        assert self.endorsement.status == "approved"

    def test_public_endpoints_not_affected_by_csrf(self) -> None:
        """Test that public endpoints work without CSRF token"""
        # Public list endpoint should work without CSRF
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200
