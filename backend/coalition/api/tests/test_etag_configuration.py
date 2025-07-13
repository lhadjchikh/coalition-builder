from django.test import TestCase, override_settings

from coalition.campaigns.models import PolicyCampaign


class ETagConfigurationTest(TestCase):
    """Test ETag middleware configuration options."""

    def setUp(self) -> None:
        """Set up test data."""
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            description="Test Description",
            active=True,
        )

    def test_default_api_prefix(self) -> None:
        """Test that default /api/ prefix works."""
        response = self.client.get("/api/campaigns/")
        assert "ETag" in response
        assert response.status_code == 200

    @override_settings(ETAG_API_PREFIX="/custom-api/")
    def test_custom_api_prefix(self) -> None:
        """Test that custom API prefix can be configured."""
        # Default /api/ should not get ETags with custom prefix
        response1 = self.client.get("/api/campaigns/")
        assert "ETag" not in response1

        # Note: We can't easily test the custom prefix since our URLs are still /api/
        # but this tests that the setting is being read correctly

    @override_settings(ETAG_API_PREFIX="/v1/api/")
    def test_different_custom_prefix(self) -> None:
        """Test with a different custom prefix."""
        # Default /api/ should not get ETags with different custom prefix
        response = self.client.get("/api/campaigns/")
        assert "ETag" not in response
