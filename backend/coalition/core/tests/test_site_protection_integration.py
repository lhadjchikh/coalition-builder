"""
Integration tests for Site Password Protection using django-lockdown
"""

import pytest
from django.test import Client, override_settings


@pytest.mark.django_db
class TestSiteProtectionIntegration:
    """Integration tests for site password protection using django-lockdown"""

    @pytest.fixture
    def client(self) -> Client:
        """Test client"""
        return Client()

    @override_settings(LOCKDOWN_ENABLED=False)
    def test_site_accessible_without_password_when_disabled(
        self,
        client: Client,
    ) -> None:
        """Test that site is accessible when password protection is disabled"""
        response = client.get("/api/campaigns/")
        assert response.status_code == 200

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_PASSWORDS=["integration-test-password"],
        LOCKDOWN_URL_EXCEPTIONS=[],  # No exceptions, so main site requires password
    )
    def test_site_requires_password_when_enabled(self, client: Client) -> None:
        """Test that site shows login form when password protection is enabled"""
        response = client.get("/")  # Test main site, not API
        assert response.status_code == 200
        assert b"Password:" in response.content

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_URL_EXCEPTIONS=[r"^/health/.*"],
        LOCKDOWN_PASSWORDS=["integration-test-password"],
    )
    def test_health_endpoint_bypasses_password_protection(self, client: Client) -> None:
        """Test that health check endpoint is accessible without password"""
        response = client.get("/health/")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_URL_EXCEPTIONS=[r"^/admin/.*"],
        LOCKDOWN_PASSWORDS=["integration-test-password"],
    )
    def test_admin_endpoint_bypasses_password_protection(self, client: Client) -> None:
        """Test that admin endpoint is accessible without site password"""
        response = client.get("/admin/")
        # Should redirect to admin login, not show site password form
        assert response.status_code == 302
        assert "/admin/login/" in response.url

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_PASSWORDS=["integration-test-password"],
        LOCKDOWN_SESSION_LOCKDOWN=True,
        LOCKDOWN_URL_EXCEPTIONS=[],  # No exceptions, so main site requires password
    )
    def test_successful_login_grants_access(self, client: Client) -> None:
        """Test that successful login allows access to protected pages"""
        # First, try to access a protected page (main site, not API)
        response = client.get("/")
        assert b"Password:" in response.content

        # Login with correct password
        response = client.post(
            "/",
            {"password": "integration-test-password"},
        )
        assert response.status_code == 302

        # Now should be able to access the protected page
        response = client.get("/")
        assert response.status_code == 200
        assert b"Password:" not in response.content

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_PASSWORDS=["integration-test-password"],
        LOCKDOWN_SESSION_LOCKDOWN=True,
        LOCKDOWN_URL_EXCEPTIONS=[],  # No exceptions, so main site requires password
    )
    def test_incorrect_password_shows_error(self, client: Client) -> None:
        """Test that incorrect password shows error message"""
        response = client.post(
            "/",
            {"password": "wrong-password"},
        )
        # django-lockdown shows the form again with error for incorrect password
        assert response.status_code == 200
        assert b"Password:" in response.content

        # Should still not be able to access protected pages
        response = client.get("/")
        assert b"Password:" in response.content

    @override_settings(
        LOCKDOWN_ENABLED=True,
        LOCKDOWN_PASSWORDS=["integration-test-password"],
        LOCKDOWN_URL_EXCEPTIONS=[r"^/api/"],  # API endpoints are exempt
    )
    def test_api_endpoints_bypass_password_protection(self, client: Client) -> None:
        """Test that API endpoints are accessible without site password"""
        response = client.get("/api/campaigns/")
        assert response.status_code == 200
        assert b"Password:" not in response.content
        # Should return JSON data, not password form
        assert "application/json" in response["content-type"]
