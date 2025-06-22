import json

from django.db import IntegrityError
from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.stakeholders.models import Stakeholder

from .models import Endorsement


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
            title="Clean Water Act",
            slug="clean-water-act",
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
        expected_str = f"{self.stakeholder} endorses {self.campaign}"
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
            title="Test Campaign",
            slug="test-campaign",
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
        """Test GET /api/endorsements/ endpoint"""
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
        # Create private endorsement
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
        )

        # List all endorsements
        response = self.client.get("/api/endorsements/")
        data = response.json()

        # Should only return the public endorsement
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

            assert response.status_code == 500

            # Verify that the stakeholder was NOT created due to transaction rollback
            assert Stakeholder.objects.count() == initial_stakeholder_count
            assert not Stakeholder.objects.filter(email="new@example.com").exists()

        # List campaign endorsements
        response = self.client.get(f"/api/endorsements/?campaign_id={self.campaign.id}")
        data = response.json()

        # Should only return the public endorsement
        assert len(data) == 1
        assert data[0]["stakeholder"]["name"] == "Jane Smith"
