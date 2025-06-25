"""
Tests for basic endorsement API endpoints.
"""

import json
from unittest.mock import patch

from django.core.cache import cache
from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from ..models import Endorsement
from .utils import get_valid_form_metadata


class EndorsementAPITest(TestCase):
    """Test the endorsement API endpoints"""

    def setUp(self) -> None:
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

        # Create test stakeholder
        self.stakeholder = Stakeholder.objects.create(
            name="Jane Smith",
            organization="Green Farms Coalition",
            role="Director",
            email="jane@greenfarms.org",
            street_address="123 Green St",
            city="Alexandria",
            state="VA",
            zip_code="22301",
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
                "street_address": "123 Farm Road",
                "city": "Westminster",
                "state": "MD",
                "zip_code": "21157",
                "county": "Carroll County",
                "type": "farmer",
            },
            "statement": "As a local farmer, I strongly support this campaign",
            "public_display": True,
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
        # Use existing stakeholder's email with EXACT matching info (security)
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Jane Smith",  # Exact match
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
        assert stakeholder.name == "Jane Smith"  # Original data preserved
        assert (
            stakeholder.organization == "Green Farms Coalition"
        )  # Original data preserved
        assert stakeholder.state == "VA"  # Original data preserved

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
                "street_address": "123 Test St",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "other",
            },
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
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "other",
            },
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
                "name": self.stakeholder.name,
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
        # Count stakeholders before the operation
        initial_stakeholder_count = Stakeholder.objects.count()

        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "New Stakeholder",
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
