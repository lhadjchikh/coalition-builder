"""
Tests for campaign API endpoints.
"""

from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign


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
        """Test GET /api/campaigns/by-name/{name}/ endpoint"""
        response = self.client.get(f"/api/campaigns/by-name/{self.campaign.name}/")
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "test-api-campaign"
        assert data["title"] == "Test API Campaign"

    def test_get_nonexistent_campaign(self) -> None:
        """Test 404 for non-existent campaign"""
        response = self.client.get("/api/campaigns/99999/")
        assert response.status_code == 404

        response = self.client.get("/api/campaigns/by-name/nonexistent-name/")
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
