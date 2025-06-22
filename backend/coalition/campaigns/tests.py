from django.test import Client, TestCase

from .models import PolicyCampaign


class PolicyCampaignModelTest(TestCase):
    """Test the PolicyCampaign model including endorsement fields"""

    def setUp(self) -> None:
        self.campaign_data = {
            "name": "clean-water-protection",
            "title": "Clean Water Protection Act",
            "summary": "Protecting our waterways for future generations",
            "description": "A comprehensive bill to strengthen water quality standards",
            "endorsement_statement": (
                "I support the Clean Water Protection Act and its goal of "
                "ensuring safe, clean water for all communities"
            ),
            "allow_endorsements": True,
            "endorsement_form_instructions": (
                "Please provide your organization details and any additional "
                "comments about why you support this legislation"
            ),
        }

    def test_create_campaign_with_endorsement_fields(self) -> None:
        """Test creating a campaign with all endorsement-related fields"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)

        assert campaign.name == "clean-water-protection"
        assert campaign.title == "Clean Water Protection Act"
        assert campaign.summary == "Protecting our waterways for future generations"
        assert campaign.description == (
            "A comprehensive bill to strengthen water quality standards"
        )
        assert campaign.endorsement_statement == (
            "I support the Clean Water Protection Act and its goal of "
            "ensuring safe, clean water for all communities"
        )
        assert campaign.allow_endorsements
        assert campaign.endorsement_form_instructions == (
            "Please provide your organization details and any additional "
            "comments about why you support this legislation"
        )
        assert campaign.active  # Default value
        assert campaign.created_at is not None

    def test_campaign_endorsement_defaults(self) -> None:
        """Test default values for endorsement fields"""
        minimal_data = {
            "name": "test-campaign",
            "title": "Test Campaign",
            "summary": "A test campaign",
        }
        campaign = PolicyCampaign.objects.create(**minimal_data)

        assert campaign.description == ""
        assert campaign.endorsement_statement == ""
        assert campaign.allow_endorsements  # Default True
        assert campaign.endorsement_form_instructions == ""

    def test_campaign_str_representation(self) -> None:
        """Test string representation of campaign"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)
        assert str(campaign) == "Clean Water Protection Act"

    def test_allow_endorsements_toggle(self) -> None:
        """Test toggling the allow_endorsements field"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)
        assert campaign.allow_endorsements

        # Disable endorsements
        campaign.allow_endorsements = False
        campaign.save()

        campaign.refresh_from_db()
        assert not campaign.allow_endorsements

    def test_campaign_with_endorsements_relationship(self) -> None:
        """Test that campaign can access its endorsements"""
        from coalition.endorsements.models import Endorsement
        from coalition.stakeholders.models import Stakeholder

        campaign = PolicyCampaign.objects.create(**self.campaign_data)

        # Create stakeholder and endorsement
        stakeholder = Stakeholder.objects.create(
            name="Test Supporter",
            organization="Test Organization",
            email="supporter@test.org",
            state="MD",
            type="nonprofit",
        )

        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=campaign,
            statement="We fully support this important legislation",
            public_display=True,
        )

        # Test reverse relationship
        campaign_endorsements = campaign.endorsements.all()
        assert campaign_endorsements.count() == 1
        assert campaign_endorsements.first() == endorsement


class PolicyCampaignAPITest(TestCase):
    """Test the campaign API endpoints with endorsement fields"""

    def setUp(self) -> None:
        self.client = Client()
        self.campaign = PolicyCampaign.objects.create(
            name="test-api-campaign",
            title="Test API Campaign",
            summary="Testing campaign API",
            description="Detailed description for API testing",
            endorsement_statement="I support this test campaign",
            allow_endorsements=True,
            endorsement_form_instructions="Please fill out the form completely",
        )

    def test_list_campaigns_includes_endorsement_fields(self) -> None:
        """Test GET /api/campaigns/ includes endorsement fields"""
        response = self.client.get("/api/campaigns/")
        assert response.status_code == 200

        data = response.json()
        assert len(data) == 1

        campaign_data = data[0]
        assert campaign_data["title"] == "Test API Campaign"
        assert campaign_data["description"] == "Detailed description for API testing"
        assert campaign_data["endorsement_statement"] == "I support this test campaign"
        assert campaign_data["allow_endorsements"]
        expected = "Please fill out the form completely"
        assert campaign_data["endorsement_form_instructions"] == expected

    def test_get_campaign_by_id(self) -> None:
        """Test GET /api/campaigns/{id}/ endpoint"""
        response = self.client.get(f"/api/campaigns/{self.campaign.id}/")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == self.campaign.id
        assert data["title"] == "Test API Campaign"
        assert data["endorsement_statement"] == "I support this test campaign"

    def test_get_campaign_by_name(self) -> None:
        """Test GET /api/campaigns/?name={name} endpoint"""
        response = self.client.get(f"/api/campaigns/?name={self.campaign.name}")
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "test-api-campaign"
        assert data["title"] == "Test API Campaign"

    def test_get_nonexistent_campaign(self) -> None:
        """Test 404 for non-existent campaign"""
        response = self.client.get("/api/campaigns/99999/")
        assert response.status_code == 404

        response = self.client.get("/api/campaigns/?name=nonexistent-name")
        assert response.status_code == 404

    def test_inactive_campaigns_not_listed(self) -> None:
        """Test that inactive campaigns are not returned"""
        # Create inactive campaign
        inactive_campaign = PolicyCampaign.objects.create(
            name="inactive-campaign",
            title="Inactive Campaign",
            summary="This campaign is inactive",
            active=False,
        )

        # List campaigns
        response = self.client.get("/api/campaigns/")
        data = response.json()

        # Should only return active campaign
        assert len(data) == 1
        assert data[0]["title"] == "Test API Campaign"

        # Direct access to inactive campaign should 404
        response = self.client.get(f"/api/campaigns/{inactive_campaign.id}/")
        assert response.status_code == 404
