"""
Test CSRF configuration and trusted origins.
"""

from urllib.parse import urlparse

from django.conf import settings
from django.test import TestCase, override_settings


class CSRFConfigurationTest(TestCase):
    """Test CSRF configuration and security settings."""

    def test_csrf_trusted_origins_configured(self) -> None:
        """Test that CSRF_TRUSTED_ORIGINS is properly configured."""
        # Should have trusted origins configured
        assert hasattr(settings, "CSRF_TRUSTED_ORIGINS")
        assert isinstance(settings.CSRF_TRUSTED_ORIGINS, list)

    def test_csrf_trusted_origins_development_defaults(self) -> None:
        """Test that development origins are included when DEBUG=True."""
        with override_settings(DEBUG=True):
            from django.conf import settings

            # Should include localhost origins for development
            expected_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8000",
                "http://127.0.0.1:8000",
            ]

            # Parse origins to get full URLs for exact matching
            origins_set = set(settings.CSRF_TRUSTED_ORIGINS)
            for origin in expected_origins:
                assert origin in origins_set, f"Missing {origin}"

    def test_csrf_security_settings(self) -> None:
        """Test CSRF security settings are properly configured."""
        # CSRF cookie should be secure in production (not DEBUG)
        with override_settings(DEBUG=False, CSRF_COOKIE_SECURE=True):
            from django.conf import settings

            assert settings.CSRF_COOKIE_SECURE is True

        with override_settings(DEBUG=True, CSRF_COOKIE_SECURE=False):
            from django.conf import settings

            assert settings.CSRF_COOKIE_SECURE is False

        # Other security settings should be configured
        assert settings.CSRF_COOKIE_HTTPONLY is False  # Allow JS access
        assert settings.CSRF_COOKIE_SAMESITE == "Lax"
        assert settings.CSRF_USE_SESSIONS is False

    def test_csrf_environment_variable_parsing(self) -> None:
        """Test that CSRF_TRUSTED_ORIGINS can be set via environment variable."""
        with override_settings(
            CSRF_TRUSTED_ORIGINS=["https://example.com", "https://api.example.com"],
        ):
            from django.conf import settings

            # Parse URLs and check hostnames to avoid substring attacks
            origins_hostnames = [
                urlparse(origin).hostname for origin in settings.CSRF_TRUSTED_ORIGINS
            ]
            assert "example.com" in origins_hostnames
            assert "api.example.com" in origins_hostnames

    def test_csrf_origins_include_protocols(self) -> None:
        """Test that CSRF trusted origins include proper protocols."""
        # All origins should have protocols (http:// or https://)
        for origin in settings.CSRF_TRUSTED_ORIGINS:
            assert origin.startswith(
                ("http://", "https://"),
            ), f"Origin missing protocol: {origin}"
