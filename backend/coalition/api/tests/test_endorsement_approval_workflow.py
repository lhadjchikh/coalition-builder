"""
Tests for the complete endorsement approval workflow.

Covers the end-to-end lifecycle:
  Submit → Email Verify → Admin Review → Public Display

These tests verify that the multi-step approval process works correctly
as an integrated flow, covering gaps not addressed by individual unit tests.
"""

import json
import uuid

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import Client, override_settings

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
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


class EndorsementApprovalLifecycleTest(BaseTestCase):
    """Test the complete endorsement approval lifecycle end-to-end via API."""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()
        self.client = Client()

        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass",
            is_staff=True,
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign",
            allow_endorsements=True,
        )

    def _submit_endorsement(self, email: str = "user@example.com") -> dict:
        """Helper: submit an endorsement via API and return the response data."""
        data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Test",
                "last_name": "User",
                "email": email,
                "street_address": "123 Main St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
                "type": "individual",
            },
            "statement": "I support this campaign",
            "public_display": True,
            "terms_accepted": True,
            "form_metadata": get_valid_form_metadata(),
        }
        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response.status_code == 200
        return response.json()

    def test_full_lifecycle_pending_to_publicly_displayed(self) -> None:
        """Test the complete lifecycle: submit → verify → approve → display."""
        # Step 1: Submit endorsement
        result = self._submit_endorsement()
        endorsement_id = result["id"]
        endorsement = Endorsement.objects.get(id=endorsement_id)
        assert endorsement.status == "pending"
        assert not endorsement.email_verified
        assert not endorsement.display_publicly

        # Endorsement should NOT appear in public list
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

        # Step 2: Verify email
        token = str(endorsement.verification_token)
        response = self.client.post(f"/api/endorsements/verify/{token}/")
        assert response.status_code == 200

        endorsement.refresh_from_db()
        assert endorsement.email_verified
        assert endorsement.status == "verified"

        # Still NOT in public list (not yet approved)
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

        # Step 3: Admin approves
        self.client.force_login(self.admin_user)
        response = self.client.post(
            f"/api/endorsements/admin/approve/{endorsement_id}/",
        )
        assert response.status_code == 200

        endorsement.refresh_from_db()
        assert endorsement.status == "approved"
        assert endorsement.reviewed_by == self.admin_user

        # Still NOT in public list (display_publicly not set by admin)
        self.client.logout()
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

        # Step 4: Admin selects for public display
        endorsement.display_publicly = True
        endorsement.save()

        # NOW it appears in public list
        response = self.client.get("/api/endorsements/")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == endorsement_id

    @override_settings(AUTO_APPROVE_VERIFIED_ENDORSEMENTS=True)
    def test_auto_approval_lifecycle(self) -> None:
        """Test lifecycle with auto-approval: submit → verify → auto-approved."""
        result = self._submit_endorsement()
        endorsement = Endorsement.objects.get(id=result["id"])
        assert endorsement.status == "pending"

        # Verify email triggers auto-approval
        token = str(endorsement.verification_token)
        response = self.client.post(f"/api/endorsements/verify/{token}/")
        assert response.status_code == 200

        endorsement.refresh_from_db()
        assert endorsement.email_verified
        assert endorsement.status == "approved"

        # Still not publicly displayed until admin selects for display
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

        # Admin selects for display
        endorsement.display_publicly = True
        endorsement.save()

        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 1

    def test_rejected_endorsement_never_displayed(self) -> None:
        """Test that rejected endorsements never appear in public list."""
        result = self._submit_endorsement()
        endorsement = Endorsement.objects.get(id=result["id"])

        # Verify email
        token = str(endorsement.verification_token)
        self.client.post(f"/api/endorsements/verify/{token}/")

        # Admin rejects
        self.client.force_login(self.admin_user)
        response = self.client.post(
            f"/api/endorsements/admin/reject/{endorsement.id}/",
        )
        assert response.status_code == 200

        endorsement.refresh_from_db()
        assert endorsement.status == "rejected"

        # Even with display_publicly=True, rejected endorsements shouldn't show
        endorsement.display_publicly = True
        endorsement.save()

        self.client.logout()
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

    def test_pending_and_verified_appear_in_admin_pending_list(self) -> None:
        """Test that both pending and verified endorsements appear in admin queue."""
        # Create a pending endorsement
        pending_stakeholder = self.create_stakeholder(
            first_name="Pending",
            last_name="User",
            email="pending@example.com",
            type="individual",
        )
        pending = Endorsement.objects.create(
            stakeholder=pending_stakeholder,
            campaign=self.campaign,
            status="pending",
        )

        # Create a verified endorsement
        verified_stakeholder = self.create_stakeholder(
            first_name="Verified",
            last_name="User",
            email="verified@example.com",
            type="individual",
        )
        verified = Endorsement.objects.create(
            stakeholder=verified_stakeholder,
            campaign=self.campaign,
            status="verified",
            email_verified=True,
        )

        # Create an approved endorsement (should NOT appear in pending list)
        approved_stakeholder = self.create_stakeholder(
            first_name="Approved",
            last_name="User",
            email="approved@example.com",
            type="individual",
        )
        Endorsement.objects.create(
            stakeholder=approved_stakeholder,
            campaign=self.campaign,
            status="approved",
            email_verified=True,
        )

        self.client.force_login(self.admin_user)
        response = self.client.get("/api/endorsements/admin/pending/")
        assert response.status_code == 200

        data = response.json()
        returned_ids = {item["id"] for item in data}
        assert pending.id in returned_ids
        assert verified.id in returned_ids
        assert len(data) == 2  # Only pending and verified

    def test_admin_approve_already_approved_is_idempotent(self) -> None:
        """Test that approving an already-approved endorsement is handled gracefully."""
        stakeholder = self.create_stakeholder(
            email="test@example.com",
            type="individual",
        )
        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=self.campaign,
            status="approved",
            reviewed_by=self.admin_user,
        )

        self.client.force_login(self.admin_user)
        response = self.client.post(
            f"/api/endorsements/admin/approve/{endorsement.id}/",
        )
        assert response.status_code == 200
        data = response.json()
        assert "already approved" in data["message"].lower()

    def test_admin_reject_already_rejected_is_idempotent(self) -> None:
        """Test that rejecting an already-rejected endorsement is handled gracefully."""
        stakeholder = self.create_stakeholder(
            email="test@example.com",
            type="individual",
        )
        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=self.campaign,
            status="rejected",
            reviewed_by=self.admin_user,
        )

        self.client.force_login(self.admin_user)
        response = self.client.post(
            f"/api/endorsements/admin/reject/{endorsement.id}/",
        )
        assert response.status_code == 200
        data = response.json()
        assert "already rejected" in data["message"].lower()


class VerificationEdgeCasesTest(BaseTestCase):
    """Test edge cases in the email verification step of the approval workflow."""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()
        self.client = Client()

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign",
            allow_endorsements=True,
        )

        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            type="individual",
        )

    def test_expired_verification_token_rejected(self) -> None:
        """Test that an expired verification token is rejected via API."""
        from datetime import timedelta

        from django.utils import timezone

        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            verification_sent_at=timezone.now() - timedelta(hours=25),
        )

        token = str(endorsement.verification_token)
        response = self.client.post(f"/api/endorsements/verify/{token}/")
        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()

        endorsement.refresh_from_db()
        assert not endorsement.email_verified

    def test_verified_endorsement_cannot_be_resubmitted(self) -> None:
        """Test that a verified endorsement blocks resubmission via API."""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            email_verified=True,
            status="verified",
            statement="Original statement",
        )

        # Try to resubmit for the same stakeholder/campaign
        data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "street_address": "123 Main St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
                "type": "individual",
            },
            "statement": "Trying to change my statement",
            "public_display": True,
            "terms_accepted": True,
            "form_metadata": get_valid_form_metadata(),
        }
        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response.status_code == 409
        assert "already been verified" in response.json()["detail"].lower()

        # Original statement should be preserved
        endorsement.refresh_from_db()
        assert endorsement.statement == "Original statement"

    def test_verify_email_does_not_change_already_approved_status(self) -> None:
        """Test verify_email() doesn't downgrade already-approved endorsement."""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            status="approved",
            email_verified=False,
        )

        endorsement.verify_email()
        assert endorsement.email_verified
        # Status should remain approved, not change to verified
        assert endorsement.status == "approved"

    def test_verify_email_does_not_change_rejected_status(self) -> None:
        """Test that verify_email() doesn't change a rejected endorsement's status."""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            status="rejected",
            email_verified=False,
        )

        endorsement.verify_email()
        assert endorsement.email_verified
        # Status should remain rejected
        assert endorsement.status == "rejected"

    def test_verification_rate_limiting(self) -> None:
        """Test that verification endpoint is rate-limited to prevent brute force."""
        Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
        )

        # Make 4 attempts — first 3 should work, 4th should be rate-limited
        responses = []
        for _ in range(4):
            token = str(uuid.uuid4())  # Wrong tokens
            response = self.client.post(
                f"/api/endorsements/verify/{token}/",
                REMOTE_ADDR="127.0.0.1",
            )
            responses.append(response)

        # 4th attempt should be rate-limited
        assert responses[3].status_code == 429
        assert "too many" in responses[3].json()["detail"].lower()


class ApprovalWorkflowDisplayConditionsTest(BaseTestCase):
    """Test that the four conditions for public display are enforced through the API."""

    def setUp(self) -> None:
        super().setUp()
        self.client = Client()

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign",
            allow_endorsements=True,
        )

    def test_each_missing_condition_excludes_from_public_list(self) -> None:
        """Test that missing any single condition excludes from public API list.

        The four conditions for public display are:
        1. public_display=True (user consent)
        2. email_verified=True
        3. status='approved'
        4. display_publicly=True (admin selection)
        """
        conditions = [
            {
                "public_display": False,
                "email_verified": True,
                "status": "approved",
                "display_publicly": True,
            },
            {
                "public_display": True,
                "email_verified": False,
                "status": "approved",
                "display_publicly": True,
            },
            {
                "public_display": True,
                "email_verified": True,
                "status": "verified",
                "display_publicly": True,
            },
            {
                "public_display": True,
                "email_verified": True,
                "status": "rejected",
                "display_publicly": True,
            },
            {
                "public_display": True,
                "email_verified": True,
                "status": "approved",
                "display_publicly": False,
            },
        ]

        for i, cond in enumerate(conditions):
            stakeholder = self.create_stakeholder(
                email=f"user{i}@example.com",
                type="individual",
            )
            Endorsement.objects.create(
                stakeholder=stakeholder,
                campaign=self.campaign,
                **cond,
            )

        # None should be visible
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200
        assert len(response.json()) == 0

    def test_all_conditions_met_shows_in_public_list(self) -> None:
        """Test that meeting all four conditions makes endorsement visible."""
        stakeholder = self.create_stakeholder(
            email="visible@example.com",
            type="individual",
        )
        Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=self.campaign,
            public_display=True,
            email_verified=True,
            status="approved",
            display_publicly=True,
        )

        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["stakeholder"]["email"] == "visible@example.com"

    def test_user_withdraws_public_consent_hides_endorsement(self) -> None:
        """Test that user setting public_display=False hides their endorsement."""
        stakeholder = self.create_stakeholder(
            email="withdrawer@example.com",
            type="individual",
        )
        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=self.campaign,
            public_display=True,
            email_verified=True,
            status="approved",
            display_publicly=True,
        )

        # Initially visible
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 1

        # User withdraws consent
        endorsement.public_display = False
        endorsement.save()

        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0

    def test_admin_removes_from_display_hides_endorsement(self) -> None:
        """Test that admin setting display_publicly=False hides the endorsement."""
        stakeholder = self.create_stakeholder(
            email="removed@example.com",
            type="individual",
        )
        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=self.campaign,
            public_display=True,
            email_verified=True,
            status="approved",
            display_publicly=True,
        )

        # Initially visible
        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 1

        # Admin removes from display
        endorsement.display_publicly = False
        endorsement.save()

        response = self.client.get("/api/endorsements/")
        assert len(response.json()) == 0
