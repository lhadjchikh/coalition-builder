"""Tests for ECS-specific settings configuration."""

import json
import os
from importlib import reload
from unittest.mock import Mock, patch

from django.test import TestCase
from requests.exceptions import (
    SSLError,
    Timeout,
)


class ECSSettingsTest(TestCase):
    """Test cases for ECS-specific settings configuration."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        # Store original environment
        self.original_env = os.environ.copy()

    def tearDown(self) -> None:
        """Clean up after tests."""
        # Restore original environment
        os.environ.clear()
        os.environ.update(self.original_env)

    def test_ecs_metadata_v4_success(self) -> None:
        """Test successful ECS metadata V4 fetching."""
        from coalition.core import settings as settings_module

        mock_task_response = Mock()
        mock_task_response.json.return_value = {
            "Containers": [
                {"Networks": [{"IPv4Addresses": ["172.31.0.2", "10.0.0.5"]}]},
            ],
        }

        with (
            patch("requests.get", return_value=mock_task_response),
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI_V4": "http://169.254.170.2/v4",
                    "ALLOWED_HOSTS": "localhost",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Check that container IPs were added
            assert "172.31.0.2" in settings_module.ALLOWED_HOSTS
            assert "10.0.0.5" in settings_module.ALLOWED_HOSTS

    def test_ecs_metadata_v4_ssl_error(self) -> None:
        """Test SSL error handling for ECS metadata V4."""
        from coalition.core import settings as settings_module

        with (
            patch("requests.get", side_effect=SSLError("SSL verification failed")),
            patch("logging.error") as mock_error,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI_V4": "http://169.254.170.2/v4",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log as error
            mock_error.assert_called()
            # Check that the SSL error message was logged
            error_calls = [str(call) for call in mock_error.call_args_list]
            assert any(
                "SSL error fetching ECS metadata V4" in call for call in error_calls
            )

    def test_ecs_metadata_v4_timeout(self) -> None:
        """Test timeout handling for ECS metadata V4."""
        from coalition.core import settings as settings_module

        with (
            patch("requests.get", side_effect=Timeout("Request timed out")),
            patch("logging.warning") as mock_warning,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI_V4": "http://169.254.170.2/v4",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log as warning
            mock_warning.assert_called()
            warning_calls = [str(call) for call in mock_warning.call_args_list]
            assert any(
                "Timeout fetching ECS metadata V4" in call for call in warning_calls
            )

    def test_ecs_metadata_v4_json_error(self) -> None:
        """Test JSONDecodeError handling for ECS metadata V4."""
        from coalition.core import settings as settings_module

        mock_response = Mock()
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)

        with (
            patch("requests.get", return_value=mock_response),
            patch("logging.warning") as mock_warning,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI_V4": "http://169.254.170.2/v4",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log as warning
            mock_warning.assert_called()
            warning_calls = [str(call) for call in mock_warning.call_args_list]
            assert any(
                "Could not fetch ECS metadata V4" in call for call in warning_calls
            )

    def test_ecs_metadata_v3_fallback(self) -> None:
        """Test fallback to ECS metadata V3 when V4 is not available."""
        from coalition.core import settings as settings_module

        mock_response = Mock()
        mock_response.json.return_value = {
            "Networks": [{"IPv4Addresses": ["172.17.0.3"]}],
        }

        with (
            patch("requests.get", return_value=mock_response),
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_EC2",
                    "ECS_CONTAINER_METADATA_URI": "http://169.254.170.2/v3",
                    "ALLOWED_HOSTS": "localhost",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Check that container IP was added
            assert "172.17.0.3" in settings_module.ALLOWED_HOSTS

    def test_ec2_public_ip_success(self) -> None:
        """Test successful EC2 public IP fetching."""
        from coalition.core import settings as settings_module

        mock_response = Mock()
        mock_response.ok = True
        mock_response.text = "54.210.223.197"

        with (
            patch("requests.get", return_value=mock_response),
            patch("logging.info") as mock_info,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_EC2",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should add public IP
            assert "54.210.223.197" in settings_module.ALLOWED_HOSTS
            info_calls = [str(call) for call in mock_info.call_args_list]
            assert any(
                "Added public IP to ALLOWED_HOSTS: 54.210.223.197" in call
                for call in info_calls
            )

    def test_ec2_public_ip_invalid(self) -> None:
        """Test handling of invalid EC2 public IP response."""
        from coalition.core import settings as settings_module

        mock_response = Mock()
        mock_response.ok = True
        mock_response.text = "not-an-ip-address"

        with (
            patch("requests.get", return_value=mock_response),
            patch("logging.warning") as mock_warning,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_EC2",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should not add invalid IP
            assert "not-an-ip-address" not in settings_module.ALLOWED_HOSTS
            warning_calls = [str(call) for call in mock_warning.call_args_list]
            assert any(
                "EC2 metadata returned invalid IP: not-an-ip-address" in call
                for call in warning_calls
            )

    def test_ec2_public_ip_not_ok_response(self) -> None:
        """Test handling of non-OK response from EC2 metadata."""
        from coalition.core import settings as settings_module

        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 404

        with (
            patch("requests.get", return_value=mock_response),
            patch("logging.debug") as mock_debug,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log debug message
            debug_calls = [str(call) for call in mock_debug.call_args_list]
            assert any(
                "EC2 metadata endpoint returned status 404" in call
                for call in debug_calls
            )

    def test_ec2_public_ip_timeout(self) -> None:
        """Test timeout handling for EC2 public IP fetching."""
        from coalition.core import settings as settings_module

        # First call succeeds (for ECS metadata), second fails (for EC2 public IP)
        with (
            patch(
                "requests.get",
                side_effect=[
                    Mock(json=lambda: {"Containers": []}),  # Task metadata
                    Timeout("Request timed out"),  # EC2 metadata
                ],
            ),
            patch("logging.debug") as mock_debug,
            patch.dict(
                os.environ,
                {
                    "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
                    "ECS_CONTAINER_METADATA_URI_V4": "http://169.254.170.2/v4",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log debug message for expected failure
            debug_calls = [str(call) for call in mock_debug.call_args_list]
            assert any(
                "EC2 metadata endpoint not available (expected on Fargate)" in call
                for call in debug_calls
            )

    def test_alb_dns_name_added(self) -> None:
        """Test that ALB DNS name is added when provided."""
        from coalition.core import settings as settings_module

        with patch.dict(
            os.environ,
            {
                "ALB_DNS_NAME": "my-alb-1234567890.us-east-1.elb.amazonaws.com",
                "ALLOWED_HOSTS": "localhost",
            },
            clear=False,
        ):
            reload(settings_module)

            assert (
                "my-alb-1234567890.us-east-1.elb.amazonaws.com"
                in settings_module.ALLOWED_HOSTS
            )

    def test_ecs_service_name_added(self) -> None:
        """Test that ECS service name is added when provided."""
        from coalition.core import settings as settings_module

        with patch.dict(
            os.environ,
            {
                "ECS_SERVICE_NAME": "my-service",
                "ALLOWED_HOSTS": "localhost",
            },
            clear=False,
        ):
            reload(settings_module)

            assert "my-service" in settings_module.ALLOWED_HOSTS
            assert "my-service.local" in settings_module.ALLOWED_HOSTS

    def test_debug_logging_enabled(self) -> None:
        """Test that ALLOWED_HOSTS is logged when DEBUG is True."""
        from coalition.core import settings as settings_module

        with (
            patch("logging.info") as mock_info,
            patch.dict(
                os.environ,
                {
                    "DEBUG": "True",
                    "ALLOWED_HOSTS": "localhost,example.com",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should log ALLOWED_HOSTS
            info_calls = [str(call) for call in mock_info.call_args_list]
            # The order of hosts may vary due to set usage
            assert any("ALLOWED_HOSTS configured:" in call for call in info_calls)

    def test_debug_logging_disabled_in_production(self) -> None:
        """Test that ALLOWED_HOSTS is not logged in production."""
        from coalition.core import settings as settings_module

        with (
            patch("logging.info") as mock_info,
            patch.dict(
                os.environ,
                {
                    "DEBUG": "False",
                    "ALLOWED_HOSTS": "example.com",
                },
                clear=False,
            ),
        ):
            reload(settings_module)

            # Should not log ALLOWED_HOSTS
            info_calls = [str(call) for call in mock_info.call_args_list]
            assert not any("ALLOWED_HOSTS configured" in call for call in info_calls)

    def test_middleware_added_in_ecs(self) -> None:
        """Test that ECS middleware is added when running in ECS."""
        from coalition.core import settings as settings_module

        with patch.dict(
            os.environ,
            {
                "AWS_EXECUTION_ENV": "AWS_ECS_FARGATE",
            },
            clear=False,
        ):
            reload(settings_module)

            # Check that middleware was added
            assert (
                "coalition.core.middleware.host_validation.ECSHostValidationMiddleware"
                in settings_module.MIDDLEWARE
            )
            # Should be first in the list
            assert settings_module.MIDDLEWARE[0] == (
                "coalition.core.middleware.host_validation.ECSHostValidationMiddleware"
            )

    def test_middleware_not_added_outside_ecs(self) -> None:
        """Test that ECS middleware is not added outside ECS."""
        from coalition.core import settings as settings_module

        with patch.dict(
            os.environ,
            {
                "AWS_EXECUTION_ENV": "",
            },
            clear=False,
        ):
            reload(settings_module)

            # Check that middleware was not added
            assert (
                "coalition.core.middleware.host_validation.ECSHostValidationMiddleware"
                not in settings_module.MIDDLEWARE
            )
