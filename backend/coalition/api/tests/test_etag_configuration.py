from django.http import HttpRequest, JsonResponse
from django.test import TestCase, override_settings

from coalition.campaigns.models import PolicyCampaign
from coalition.core.middleware.etag import ETagMiddleware


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
        assert response.has_header("ETag")
        assert response.status_code == 200

    @override_settings(ETAG_API_PREFIX="/custom-api/")
    def test_custom_api_prefix(self) -> None:
        """Test that custom API prefix can be configured."""
        # Default /api/ should not get ETags with custom prefix
        response1 = self.client.get("/api/campaigns/")
        assert not response1.has_header("ETag")

        # Test custom prefix functionality with middleware directly
        def get_custom_response(request: HttpRequest) -> JsonResponse:
            return JsonResponse({"test": "custom prefix data"}, status=200)

        middleware = ETagMiddleware(get_custom_response)

        # Test request with custom prefix
        request = HttpRequest()
        request.path = "/custom-api/test/"
        request.method = "GET"
        request.GET = {}

        response = middleware(request)
        assert response.has_header("ETag")

    @override_settings(ETAG_API_PREFIX="/v1/api/")
    def test_different_custom_prefix(self) -> None:
        """Test with a different custom prefix."""
        # Default /api/ should not get ETags with different custom prefix
        response = self.client.get("/api/campaigns/")
        assert not response.has_header("ETag")
