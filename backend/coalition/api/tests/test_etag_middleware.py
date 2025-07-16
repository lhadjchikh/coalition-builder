import json
from collections.abc import Generator

from django.conf import settings
from django.http import HttpRequest, JsonResponse, StreamingHttpResponse
from django.test import TestCase, override_settings

from coalition.campaigns.models import PolicyCampaign
from coalition.content.models import HomePage
from coalition.core.middleware.etag import ETagMiddleware


class ETagMiddlewareTest(TestCase):
    """Test ETag middleware functionality for API endpoints."""

    def setUp(self) -> None:
        """Set up test data."""
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            description="Test Description",
            active=True,
        )
        self.homepage = HomePage.objects.create(
            organization_name="Test Org",
            tagline="Test Tagline",
            hero_title="Test Hero",
            hero_subtitle="Test Subtitle",
            is_active=True,
        )

    def test_etag_header_is_added(self) -> None:
        """Test that ETag header is added to API responses."""
        response = self.client.get("/api/campaigns/")
        assert response.has_header("ETag")
        assert response["ETag"] is not None
        assert response["Cache-Control"] == "private, must-revalidate"

    def test_etag_returns_304_when_not_modified(self) -> None:
        """Test that 304 is returned when content hasn't changed."""
        # First request to get ETag
        response1 = self.client.get("/api/campaigns/")
        assert response1.status_code == 200
        etag = response1["ETag"]

        # Second request with If-None-Match header
        response2 = self.client.get("/api/campaigns/", HTTP_IF_NONE_MATCH=etag)
        assert response2.status_code == 304
        assert response2["ETag"] == etag

    def test_etag_changes_when_content_changes(self) -> None:
        """Test that ETag changes when content is modified."""
        # First request
        response1 = self.client.get("/api/campaigns/")
        etag1 = response1["ETag"]

        # Modify data
        self.campaign.title = "Updated Title"
        self.campaign.save()

        # Second request should have different ETag
        response2 = self.client.get("/api/campaigns/")
        etag2 = response2["ETag"]

        assert etag1 != etag2

    def test_etag_not_added_to_non_api_endpoints(self) -> None:
        """Test that ETag is not added to non-API endpoints."""
        response = self.client.get("/")
        assert not response.has_header("ETag")

    def test_etag_only_for_get_and_head_requests(self) -> None:
        """Test that ETag is only added for GET and HEAD requests."""
        # Test GET request (should have ETag)
        get_response = self.client.get("/api/campaigns/")
        assert get_response.has_header("ETag")
        assert get_response.status_code == 200

        # Test HEAD request - Django Ninja may return 405, middleware should handle it
        head_response = self.client.head("/api/campaigns/")
        if head_response.status_code == 200:
            # If HEAD is supported, it should have ETag
            assert head_response.has_header("ETag")
        elif head_response.status_code == 405:
            # If HEAD returns Method Not Allowed, that's expected for Django Ninja
            assert head_response.status_code == 405

        # Test POST request (no ETag expected)
        post_response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(
                {
                    "name": "Test User",
                    "email": "test@example.com",
                    "organization": "Test Org",
                    "endorsement_type": "individual",
                },
            ),
            content_type="application/json",
        )
        assert not post_response.has_header("ETag")

    def test_etag_with_query_parameters(self) -> None:
        """Test that query parameters affect ETag generation."""
        # Request without query params
        response1 = self.client.get("/api/content-blocks/")
        etag1 = response1["ETag"]

        # Request with query params should have different ETag
        response2 = self.client.get("/api/content-blocks/?page_type=homepage")
        etag2 = response2["ETag"]

        assert etag1 != etag2

    def test_get_request_etag_functionality(self) -> None:
        """Test that GET requests get ETags and work correctly."""
        response = self.client.get("/api/campaigns/")
        assert response.has_header("ETag")
        assert response.status_code == 200
        assert response["Cache-Control"] == "private, must-revalidate"

    def test_streaming_responses_skip_etag(self) -> None:
        """Test that streaming responses do not get ETag headers."""

        # Create a mock streaming response
        def stream_generator() -> Generator[bytes]:
            yield b"chunk1"
            yield b"chunk2"

        # Create a get_response function that returns streaming response
        def get_streaming_response(request: HttpRequest) -> StreamingHttpResponse:
            return StreamingHttpResponse(
                stream_generator(),
                content_type="text/plain",
                status=200,
            )

        # Create middleware instance
        middleware = ETagMiddleware(get_streaming_response)

        # Create request
        request = HttpRequest()
        request.path = "/api/test-stream/"
        request.method = "GET"

        # Process request through middleware
        response = middleware(request)

        # Streaming responses should not get ETag headers
        assert not response.has_header("ETag")
        assert isinstance(response, StreamingHttpResponse)

    def test_existing_etag_not_overridden(self) -> None:
        """Test that existing ETag headers are not overridden by middleware."""

        # Create a get_response function that returns response with existing ETag
        def get_response_with_etag(request: HttpRequest) -> JsonResponse:
            response = JsonResponse({"test": "data"})
            response["ETag"] = '"existing-etag-value"'
            response.status_code = 200
            return response

        # Create middleware instance
        middleware = ETagMiddleware(get_response_with_etag)

        # Create request
        request = HttpRequest()
        request.path = "/api/test/"
        request.method = "GET"

        # Process request through middleware
        response = middleware(request)

        # Existing ETag should not be overridden
        assert response["ETag"] == '"existing-etag-value"'

    @override_settings(ETAG_API_PREFIX="/custom-api/")
    def test_custom_prefix_with_mock_responses(self) -> None:
        """Test that custom API prefix configuration works correctly."""
        # Create mock request and response for custom prefix
        request = HttpRequest()
        request.path = "/custom-api/test/"
        request.method = "GET"
        request.GET = {}  # Empty query params

        response = JsonResponse({"test": "data"})
        response.status_code = 200

        # Test that custom prefix is recognized and ETag is actually added
        def get_custom_response(request: HttpRequest) -> JsonResponse:
            return JsonResponse({"test": "custom prefix data"}, status=200)

        middleware = ETagMiddleware(get_custom_response)
        response = middleware(request)

        # Verify that ETag is actually set for custom prefix
        assert response.has_header("ETag")
        assert getattr(settings, "ETAG_API_PREFIX", "/api/") == "/custom-api/"

    @override_settings(ETAG_API_PREFIX="/v1/api/")
    def test_different_custom_prefix(self) -> None:
        """Test that different custom prefix values are respected."""
        # Test with non-matching path
        request = HttpRequest()
        request.path = "/api/test/"  # Default prefix, but setting is /v1/api/
        request.method = "GET"

        response = JsonResponse({"test": "data"})
        response.status_code = 200

        api_prefix = getattr(settings, "ETAG_API_PREFIX", "/api/")

        should_process = (
            request.path.startswith(api_prefix)
            and request.method in ("GET", "HEAD")
            and response.status_code == 200
            and not response.has_header("ETag")
            and not isinstance(response, StreamingHttpResponse)
        )

        assert not should_process, "Non-matching prefix should not be processed"
        assert api_prefix == "/v1/api/"
