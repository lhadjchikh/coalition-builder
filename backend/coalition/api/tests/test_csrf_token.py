"""Tests for CSRF token endpoint."""

from django.test import Client, TestCase


class CSRFTokenEndpointTest(TestCase):
    """Test the CSRF token endpoint."""

    def setUp(self) -> None:
        """Set up test client."""
        self.client = Client()

    def test_csrf_token_endpoint_returns_token(self) -> None:
        """Test that the CSRF token endpoint returns a valid token."""
        response = self.client.get("/api/csrf-token/")

        assert response.status_code == 200
        assert "csrf_token" in response.json()
        assert response.json()["csrf_token"] is not None
        assert len(response.json()["csrf_token"]) > 0

    def test_csrf_token_endpoint_returns_different_tokens_for_different_sessions(
        self,
    ) -> None:
        """Test that different clients get different CSRF tokens."""
        client1 = Client()
        client2 = Client()

        response1 = client1.get("/api/csrf-token/")
        response2 = client2.get("/api/csrf-token/")

        token1 = response1.json()["csrf_token"]
        token2 = response2.json()["csrf_token"]

        # Tokens should be different for different sessions
        assert token1 != token2

    def test_csrf_token_can_be_used_for_post_request(self) -> None:
        """Test that the CSRF token from the endpoint can be used for POST requests."""
        # Get CSRF token
        token_response = self.client.get("/api/csrf-token/")
        csrf_token = token_response.json()["csrf_token"]

        # Try to use it for a POST request (to endorsements endpoint)
        # This should not return 403 Forbidden
        response = self.client.post(
            "/api/endorsements/",
            data={
                "statement": "Test statement",
                "public_display": True,
                "terms_accepted": True,
                "campaign_id": 1,
                "stakeholder": {
                    "email": "test@example.com",
                    "first_name": "Test",
                    "last_name": "User",
                    "state": "CA",
                    "type": "individual",
                },
            },
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        # Should not get 403 Forbidden
        assert response.status_code != 403

    def test_post_without_csrf_token_returns_403(self) -> None:
        """Test that POST requests without CSRF token return 403."""
        # Try POST without CSRF token to an endpoint that requires it
        response = self.client.post(
            "/api/endorsements/admin/approve/1/",
            content_type="application/json",
        )

        # Should get 403 Forbidden
        assert response.status_code == 403

    def test_post_with_invalid_csrf_token_returns_403(self) -> None:
        """Test that POST requests with invalid CSRF token return 403."""
        # Try POST with invalid CSRF token
        response = self.client.post(
            "/api/endorsements/admin/approve/1/",
            content_type="application/json",
            HTTP_X_CSRFTOKEN="invalid-token-12345",
        )

        # Should get 403 Forbidden
        assert response.status_code == 403
