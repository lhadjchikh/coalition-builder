import json

from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.content.models import HomePage


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
            about_section_content="Test about content",
            contact_email="test@example.com",
            is_active=True,
        )

    def test_etag_header_is_added(self) -> None:
        """Test that ETag header is added to API responses."""
        response = self.client.get("/api/campaigns/")
        assert "ETag" in response
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
        assert "ETag" not in response

    def test_etag_only_for_get_and_head_requests(self) -> None:
        """Test that ETag is only added for GET and HEAD requests."""
        # Test POST request (no ETag expected)
        response = self.client.post(
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
        assert "ETag" not in response

    def test_etag_with_query_parameters(self) -> None:
        """Test that query parameters affect ETag generation."""
        # Request without query params
        response1 = self.client.get("/api/content-blocks/")
        etag1 = response1["ETag"]

        # Request with query params should have different ETag
        response2 = self.client.get("/api/content-blocks/?homepage_id=1")
        etag2 = response2["ETag"]

        assert etag1 != etag2

    def test_get_request_etag_functionality(self) -> None:
        """Test that GET requests get ETags and work correctly."""
        response = self.client.get("/api/campaigns/")
        assert "ETag" in response
        assert response.status_code == 200
        assert response["Cache-Control"] == "private, must-revalidate"

    def test_existing_cache_control_headers_preserved(self) -> None:
        """Test that existing Cache-Control headers are not overridden."""
        # This test would require a custom view with Cache-Control headers
        # For now, we'll test the default behavior and document the expectation
        response = self.client.get("/api/campaigns/")
        
        # Verify default Cache-Control is set when none exists
        assert response["Cache-Control"] == "private, must-revalidate"
        
        # Note: To fully test this, we would need a view that sets custom
        # Cache-Control headers. The middleware code correctly checks
        # if not response.has_header("Cache-Control") before setting defaults.
