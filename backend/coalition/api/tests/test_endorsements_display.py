"""
Tests for endorsement display API functionality.
"""

from django.test import Client

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.test_base import BaseTestCase


class EndorsementDisplayAPITest(BaseTestCase):
    """Test endorsement display filtering in API"""

    def setUp(self) -> None:
        super().setUp()
        self.client = Client()

        # Create test campaign
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test campaign summary",
            allow_endorsements=True,
        )

        # Create multiple stakeholders
        self.stakeholders = []
        for i in range(5):
            stakeholder = self.create_stakeholder(
                first_name=f"User{i}",
                last_name="Test",
                email=f"user{i}@example.com",
                street_address="123 Main St",
                city="Anytown",
                state=self.california,  # Use Region object from fixture
                zip_code="12345",
                type="individual",
            )
            self.stakeholders.append(stakeholder)

    def test_only_display_publicly_endorsements_shown(self) -> None:
        """Test that only endorsements with display_publicly=True are shown"""
        # Create endorsements with different display_publicly values
        endorsements = []
        for i, stakeholder in enumerate(self.stakeholders):
            endorsement = Endorsement.objects.create(
                stakeholder=stakeholder,
                campaign=self.campaign,
                statement=f"Statement {i}",
                public_display=True,
                status="approved",
                email_verified=True,
                display_publicly=(
                    i % 2 == 0
                ),  # Only even indices have display_publicly=True
            )
            endorsements.append(endorsement)

        # Get endorsements from API
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        # Should only see 3 endorsements (indices 0, 2, 4)
        assert len(data) == 3

        # Check that only display_publicly=True endorsements are returned
        returned_emails = {e["stakeholder"]["email"] for e in data}
        expected_emails = {
            "user0@example.com",
            "user2@example.com",
            "user4@example.com",
        }
        assert returned_emails == expected_emails

    def test_display_order_newest_first(self) -> None:
        """Test that displayed endorsements are ordered by created_at descending"""
        # Create endorsements with display_publicly=True
        for i in range(3):
            Endorsement.objects.create(
                stakeholder=self.stakeholders[i],
                campaign=self.campaign,
                statement=f"Statement {i}",
                public_display=True,
                status="approved",
                email_verified=True,
                display_publicly=True,
            )

        # Get endorsements from API
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 3

        # Check order - newest should be first (user2, user1, user0)
        assert data[0]["stakeholder"]["email"] == "user2@example.com"
        assert data[1]["stakeholder"]["email"] == "user1@example.com"
        assert data[2]["stakeholder"]["email"] == "user0@example.com"

    def test_all_conditions_required_for_display(self) -> None:
        """Test that all conditions must be met for an endorsement to be displayed"""
        # Create endorsements missing different conditions
        test_cases = [
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
                "status": "pending",
                "display_publicly": True,
            },
            {
                "public_display": True,
                "email_verified": True,
                "status": "approved",
                "display_publicly": False,
            },
            {
                "public_display": True,
                "email_verified": True,
                "status": "approved",
                "display_publicly": True,
            },  # This one should show
        ]

        for i, conditions in enumerate(test_cases):
            Endorsement.objects.create(
                stakeholder=self.stakeholders[i],
                campaign=self.campaign,
                statement=f"Statement {i}",
                **conditions,
            )

        # Get endorsements from API
        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        # Should only see the last endorsement where all conditions are met
        assert len(data) == 1
        assert data[0]["stakeholder"]["email"] == "user4@example.com"

    def test_campaign_filter_with_display_publicly(self) -> None:
        """Test campaign filtering works with display_publicly"""
        # Create another campaign
        campaign2 = PolicyCampaign.objects.create(
            name="campaign-2",
            title="Campaign 2",
            allow_endorsements=True,
        )

        # Create endorsements for both campaigns
        for i in range(4):
            campaign = self.campaign if i < 2 else campaign2
            Endorsement.objects.create(
                stakeholder=self.stakeholders[i],
                campaign=campaign,
                statement=f"Statement {i}",
                public_display=True,
                status="approved",
                email_verified=True,
                display_publicly=True,
            )

        # Test filtering by campaign 1
        response = self.client.get(f"/api/endorsements/?campaign_id={self.campaign.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        for endorsement in data:
            assert endorsement["campaign"]["id"] == self.campaign.id

        # Test filtering by campaign 2
        response = self.client.get(f"/api/endorsements/?campaign_id={campaign2.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        for endorsement in data:
            assert endorsement["campaign"]["id"] == campaign2.id

    def test_display_publicly_not_in_response(self) -> None:
        """Test that display_publicly field is not included in API response"""
        Endorsement.objects.create(
            stakeholder=self.stakeholders[0],
            campaign=self.campaign,
            statement="Test statement",
            public_display=True,
            status="approved",
            email_verified=True,
            display_publicly=True,
        )

        response = self.client.get("/api/endorsements/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1

        # Check that display_publicly is not in the response
        endorsement = data[0]
        assert "display_publicly" not in endorsement
        # But other fields should be present
        assert "statement" in endorsement
        assert "public_display" in endorsement
        assert "status" in endorsement
