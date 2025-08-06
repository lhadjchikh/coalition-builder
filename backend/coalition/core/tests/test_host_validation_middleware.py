"""Tests for ECS Host Validation Middleware."""

from unittest.mock import Mock, patch

from django.http import HttpRequest, HttpResponse
from django.test import TestCase

from coalition.core.middleware.host_validation import ECSHostValidationMiddleware


class ECSHostValidationMiddlewareTest(TestCase):
    """Test cases for ECS Host Validation Middleware."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        self.get_response = Mock(return_value=HttpResponse())
        self.middleware = ECSHostValidationMiddleware(self.get_response)
        self.request = Mock(spec=HttpRequest)
        self.request.META = {}

    def test_health_check_paths_bypass_validation(self) -> None:
        """Test that health check paths bypass host validation."""
        health_paths = ["/health/", "/health", "/api/health/"]

        for path in health_paths:
            with self.subTest(path=path):
                self.request.path = path
                self.request.META["HTTP_HOST"] = "192.168.1.1"

                self.middleware(self.request)

                # Should call get_response without modifying host
                self.get_response.assert_called_with(self.request)
                assert self.request.META["HTTP_HOST"] == "192.168.1.1"

    def test_x_forwarded_host_used_when_present(self) -> None:
        """Test that X-Forwarded-Host header is used when present."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "192.168.1.1",
            "HTTP_X_FORWARDED_HOST": "example.com",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should update HTTP_HOST with forwarded value
            assert self.request.META["HTTP_HOST"] == "example.com"
            mock_logger.debug.assert_called_once_with(
                "Using X-Forwarded-Host: example.com",
            )

    def test_ip_address_detection_without_port(self) -> None:
        """Test IP address detection without port number."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "192.168.1.1",
            "HTTP_X_FORWARDED_PROTO": "https",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should log the IP address detection
            mock_logger.debug.assert_any_call(
                "Request with IP Host header: 192.168.1.1, "
                "Path: /api/endpoint, "
                "X-Forwarded-Proto: https",
            )
            mock_logger.debug.assert_any_call(
                "Allowing API request with IP host: 192.168.1.1",
            )

    def test_ip_address_detection_with_port(self) -> None:
        """Test IP address detection with port number."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "192.168.1.1:8000",
            "HTTP_X_FORWARDED_PROTO": "http",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should handle port correctly
            mock_logger.debug.assert_any_call(
                "Request with IP Host header: 192.168.1.1:8000, "
                "Path: /api/endpoint, "
                "X-Forwarded-Proto: http",
            )

    def test_ipv6_address_detection(self) -> None:
        """Test IPv6 address detection with brackets."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "[2001:db8::1]",  # IPv6 in brackets
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should detect IPv6 address
            mock_logger.debug.assert_any_call(
                "Request with IP Host header: [2001:db8::1], "
                "Path: /api/endpoint, "
                "X-Forwarded-Proto: http",
            )

    def test_ipv6_address_without_brackets(self) -> None:
        """Test IPv6 address detection without brackets."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "2001:db8::1",  # IPv6 without brackets
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should detect IPv6 address
            mock_logger.debug.assert_any_call(
                "Request with IP Host header: 2001:db8::1, "
                "Path: /api/endpoint, "
                "X-Forwarded-Proto: http",
            )

    def test_hostname_not_treated_as_ip(self) -> None:
        """Test that hostnames are not treated as IP addresses."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "example.com",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should not log as IP address
            mock_logger.debug.assert_not_called()
            mock_logger.warning.assert_not_called()

    def test_hostname_starting_with_digit_not_treated_as_ip(self) -> None:
        """Test that hostnames starting with digit are not treated as IP."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "1example.com",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should not log as IP address - hostname starting with digit is not an IP
            mock_logger.debug.assert_not_called()
            mock_logger.warning.assert_not_called()

    def test_non_api_path_with_ip_host(self) -> None:
        """Test non-API path with IP host header."""
        self.request.path = "/admin/login"
        self.request.META = {
            "HTTP_HOST": "192.168.1.1",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should log IP detection but not the "allowing" message
            mock_logger.debug.assert_called_once_with(
                "Request with IP Host header: 192.168.1.1, "
                "Path: /admin/login, "
                "X-Forwarded-Proto: http",
            )

    def test_empty_host_header(self) -> None:
        """Test handling of empty host header."""
        self.request.path = "/api/endpoint"
        self.request.META = {}

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should handle gracefully without logging
            mock_logger.debug.assert_not_called()
            self.get_response.assert_called_with(self.request)

    def test_no_x_forwarded_proto(self) -> None:
        """Test IP request without X-Forwarded-Proto header."""
        self.request.path = "/api/endpoint"
        self.request.META = {
            "HTTP_HOST": "10.0.0.1",
        }

        with patch("coalition.core.middleware.host_validation.logger") as mock_logger:
            self.middleware(self.request)

            # Should use default 'http' for X-Forwarded-Proto
            mock_logger.debug.assert_any_call(
                "Request with IP Host header: 10.0.0.1, "
                "Path: /api/endpoint, "
                "X-Forwarded-Proto: http",
            )
