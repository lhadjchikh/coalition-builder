from django.http import HttpRequest, JsonResponse
from django.test import TestCase, override_settings
from django.urls import path
from ninja import NinjaAPI

# Create a test API with custom Cache-Control headers
test_api = NinjaAPI()


@test_api.get("/test-custom-cache/")
def test_custom_cache_view(request: HttpRequest) -> JsonResponse:
    """Test view that sets custom Cache-Control headers."""
    response = JsonResponse({"message": "test"})
    response["Cache-Control"] = "public, max-age=3600"
    return response


@test_api.get("/test-no-cache/")
def test_no_cache_view(request: HttpRequest) -> JsonResponse:
    """Test view with no-cache header."""
    response = JsonResponse({"message": "no-cache"})
    response["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response


# Test URL patterns
test_urlpatterns = [
    path("api/test/", test_api.urls),
]


@override_settings(ROOT_URLCONF="coalition.api.tests.test_etag_cache_control")
class CacheControlPreservationTest(TestCase):
    """Test that ETag middleware preserves existing Cache-Control headers."""

    def test_custom_cache_control_preserved(self) -> None:
        """Test that custom Cache-Control headers are preserved."""
        response = self.client.get("/api/test/test-custom-cache/")

        # Should have ETag
        assert "ETag" in response
        assert response.status_code == 200

        # Custom Cache-Control should be preserved
        assert response["Cache-Control"] == "public, max-age=3600"

    def test_no_cache_header_preserved(self) -> None:
        """Test that no-cache headers are preserved."""
        response = self.client.get("/api/test/test-no-cache/")

        # Should have ETag
        assert "ETag" in response
        assert response.status_code == 200

        # No-cache header should be preserved
        assert response["Cache-Control"] == "no-cache, no-store, must-revalidate"


# Make the urlpatterns available for Django
urlpatterns = test_urlpatterns
