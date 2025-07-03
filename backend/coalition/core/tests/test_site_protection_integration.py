"""
Integration tests for Site Password Protection
"""

import os
from unittest.mock import patch

import pytest
from django.http import HttpRequest
from django.test import Client, override_settings


@pytest.mark.django_db
class TestSiteProtectionIntegration:
    """Integration tests for site password protection"""

    @pytest.fixture
    def client(self) -> Client:
        """Test client"""
        return Client()

    @override_settings(SITE_PASSWORD_ENABLED="false")
    def test_site_accessible_without_password_when_disabled(
        self,
        client: Client,
    ) -> None:
        """Test that site is accessible when password protection is disabled"""
        response = client.get("/api/")
        assert response.status_code == 200

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_site_requires_password_when_enabled(self, client: Client) -> None:
        """Test that site shows login form when password protection is enabled"""
        response = client.get("/api/")
        assert response.status_code == 200
        assert b"Site Access" in response.content
        assert b"Access Password" in response.content

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_health_endpoint_bypasses_password_protection(self, client: Client) -> None:
        """Test that health check endpoint is accessible without password"""
        response = client.get("/health/")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_admin_endpoint_bypasses_password_protection(self, client: Client) -> None:
        """Test that admin endpoint is accessible without site password"""
        response = client.get("/admin/")
        # Should redirect to admin login, not show site password form
        assert response.status_code == 302
        assert "/admin/login/" in response.url

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_successful_login_grants_access(self, client: Client) -> None:
        """Test that successful login allows access to protected pages"""
        # First, try to access a protected page
        response = client.get("/api/")
        assert b"Site Access" in response.content

        # Login with correct password
        response = client.post(
            "/site-login/",
            {"password": "integration-test-password", "next": "/api/"},
        )
        assert response.status_code == 302
        assert response.url == "/api/"

        # Now should be able to access the protected page
        response = client.get("/api/")
        assert response.status_code == 200
        assert b"Site Access" not in response.content

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_incorrect_password_shows_error(self, client: Client) -> None:
        """Test that incorrect password shows error message"""
        response = client.post(
            "/site-login/",
            {"password": "wrong-password", "next": "/api/"},
        )
        assert response.status_code == 200
        assert b"Incorrect password" in response.content

        # Should still not be able to access protected pages
        response = client.get("/api/")
        assert b"Site Access" in response.content

    @override_settings(
        SITE_PASSWORD_ENABLED="true",
        SITE_PASSWORD="integration-test-password",
        MIDDLEWARE=[
            "whitenoise.middleware.WhiteNoiseMiddleware",
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "coalition.middleware.site_protection.SitePasswordProtectionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
        ],
    )
    def test_session_persists_across_requests(self, client: Client) -> None:
        """Test that authentication persists across multiple requests"""
        # Login
        response = client.post(
            "/site-login/",
            {"password": "integration-test-password", "next": "/"},
        )
        assert response.status_code == 302

        # Access multiple protected endpoints
        for endpoint in ["/api/", "/api/themes/", "/api/campaigns/"]:
            response = client.get(endpoint)
            assert response.status_code == 200
            assert b"Site Access" not in response.content

    def test_environment_variable_configuration(self) -> None:
        """Test that middleware reads configuration from environment variables"""
        with patch.dict(
            os.environ,
            {"SITE_PASSWORD_ENABLED": "true", "SITE_PASSWORD": "env-test-password"},
        ):
            from coalition.middleware.site_protection import (
                SitePasswordProtectionMiddleware,
            )

            def mock_get_response(request: HttpRequest) -> None:
                return None

            middleware = SitePasswordProtectionMiddleware(mock_get_response)
            assert middleware.enabled is True
            assert middleware.password == "env-test-password"

    def test_missing_password_raises_error(self) -> None:
        """Test that enabling protection without password raises error"""
        with patch.dict(
            os.environ,
            {"SITE_PASSWORD_ENABLED": "true", "SITE_PASSWORD": ""},
        ):
            from coalition.middleware.site_protection import (
                SitePasswordProtectionMiddleware,
            )

            def mock_get_response(request: HttpRequest) -> None:
                return None

            with pytest.raises(
                ValueError,
                match="SITE_PASSWORD must be set",
            ) as exc_info:
                SitePasswordProtectionMiddleware(mock_get_response)

            assert "SITE_PASSWORD must be set" in str(exc_info.value)
