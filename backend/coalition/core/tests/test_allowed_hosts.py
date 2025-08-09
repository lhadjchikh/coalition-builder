"""
Tests for Django settings ALLOWED_HOSTS configuration.
This ensures the NetworkError fix works properly in production.
"""

import json
import os
from importlib import reload
from unittest.mock import Mock, patch

from django.test import TestCase

from coalition.core import settings as settings_module


class AllowedHostsConfigurationTest(TestCase):
    """Test ALLOWED_HOSTS configuration for production deployment."""

    def setUp(self) -> None:
        """Set up test environment."""
        self.original_env = os.environ.copy()

    def tearDown(self) -> None:
        """Clean up test environment."""
        os.environ.clear()
        os.environ.update(self.original_env)

    def test_default_allowed_hosts_parsing(self) -> None:
        """Test that ALLOWED_HOSTS is parsed correctly from environment."""
        with patch.dict(
            os.environ,
            {"ALLOWED_HOSTS": "localhost,127.0.0.1,example.com"},
            clear=False,
        ):
            # Reload settings module to pick up new environment
            reload(settings_module)

            expected_hosts = {"localhost", "127.0.0.1", "example.com", "testserver"}
            actual_hosts = set(settings_module.ALLOWED_HOSTS)

            # Check that all expected hosts are present
            for host in expected_hosts:
                assert host in actual_hosts

    def test_production_domain_included(self) -> None:
        """Test that production domain is included in ALLOWED_HOSTS."""
        hosts = "localhost,127.0.0.1,coalition.org,www.coalition.org,api,nginx,ssr"
        with patch.dict(
            os.environ,
            {"ALLOWED_HOSTS": hosts},
            clear=False,
        ):
            reload(settings_module)

            production_hosts = {"coalition.org", "www.coalition.org"}
            internal_hosts = {"api", "nginx", "ssr"}

            actual_hosts = set(settings_module.ALLOWED_HOSTS)

            # Check production domains are included
            for host in production_hosts:
                assert (
                    host in actual_hosts
                ), f"Production host {host} should be in ALLOWED_HOSTS"

            # Check internal service names are included
            for host in internal_hosts:
                assert (
                    host in actual_hosts
                ), f"Internal service {host} should be in ALLOWED_HOSTS"

    def test_ecs_metadata_integration(self) -> None:
        """Test that ECS container IP is added to ALLOWED_HOSTS."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "Networks": [{"IPv4Addresses": ["172.17.0.5"]}],
        }

        with (
            patch("requests.get", return_value=mock_response),
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI": "http://169.254.170.2/v3",
                    "ALLOWED_HOSTS": "localhost,127.0.0.1",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            assert (
                "172.17.0.5" in settings_module.ALLOWED_HOSTS
            ), "ECS container IP should be added to ALLOWED_HOSTS"

    def test_csrf_trusted_origins_configuration(self) -> None:
        """Test that CSRF_TRUSTED_ORIGINS is configured correctly for production."""
        with patch.dict(
            os.environ,
            {"CSRF_TRUSTED_ORIGINS": "https://coalition.org,https://www.coalition.org"},
            clear=False,
        ):
            reload(settings_module)

            expected_origins = ["https://coalition.org", "https://www.coalition.org"]

            for origin in expected_origins:
                assert (
                    origin in settings_module.CSRF_TRUSTED_ORIGINS
                ), f"CSRF trusted origin {origin} should be configured"

    def test_json_array_allowed_hosts_parsing(self) -> None:
        """Test that ALLOWED_HOSTS supports JSON array format."""
        hosts_json = json.dumps(["localhost", "127.0.0.1", "api.example.com"])

        with patch.dict(os.environ, {"ALLOWED_HOSTS": hosts_json}, clear=False):
            reload(settings_module)

            expected_hosts = {"localhost", "127.0.0.1", "api.example.com", "testserver"}
            actual_hosts = set(settings_module.ALLOWED_HOSTS)

            for host in expected_hosts:
                assert host in actual_hosts

    def test_malformed_allowed_hosts_fallback(self) -> None:
        """Test that malformed ALLOWED_HOSTS falls back to comma-separated parsing."""
        with patch.dict(
            os.environ,
            {"ALLOWED_HOSTS": 'localhost,127.0.0.1,malformed["json'},
            clear=False,
        ):
            reload(settings_module)

            # Should fallback to comma-separated parsing
            expected_hosts = {"localhost", "127.0.0.1", 'malformed["json', "testserver"}
            actual_hosts = set(settings_module.ALLOWED_HOSTS)

            for host in expected_hosts:
                assert host in actual_hosts

    def test_duplicate_hosts_removed(self) -> None:
        """Test that duplicate hosts are removed from ALLOWED_HOSTS."""
        with patch.dict(
            os.environ,
            {"ALLOWED_HOSTS": "localhost,127.0.0.1,localhost,api"},
            clear=False,
        ):
            reload(settings_module)

            # Count occurrences of localhost
            localhost_count = settings_module.ALLOWED_HOSTS.count("localhost")
            assert localhost_count == 1, "Duplicate hosts should be removed"
