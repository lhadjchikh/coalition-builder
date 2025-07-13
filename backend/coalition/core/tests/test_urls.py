from django.test import TestCase
from django.urls import resolve, reverse


class URLTest(TestCase):
    """Test URL configurations."""

    def test_admin_url(self) -> None:
        """Test admin URL is configured."""
        url = reverse("admin:index")
        assert url == "/admin/"

    def test_api_url_pattern(self) -> None:
        """Test API URL pattern resolves."""
        # Test that the API URLs are included
        resolved = resolve("/api/campaigns/")
        assert resolved.route == "api/"

    def test_root_url(self) -> None:
        """Test root URL redirects to homepage."""
        response = self.client.get("/")
        # Should get a response (may be 200 or redirect)
        assert response.status_code in [200, 301, 302]
