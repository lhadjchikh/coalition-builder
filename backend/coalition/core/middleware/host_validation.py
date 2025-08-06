"""
Middleware for secure host validation in AWS ECS/ALB environments.

This middleware allows ALB health checks while maintaining Host header security.
"""

import ipaddress
import logging
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


class ECSHostValidationMiddleware:
    """
    Middleware to handle host validation for ECS deployments behind ALB.

    This middleware handles several scenarios:
    1. ALB health checks that use container IP as Host header
    2. Requests from ALB with X-Forwarded-Host header
    3. Requests that come with an IP address as Host header
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self.health_check_paths = [
            "/health/",  # Django health check
            "/health",  # Next.js health check
            "/api/health/",
        ]

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Check if this is a health check request
        if request.path in self.health_check_paths:
            # For health checks, we don't care about the Host header
            return self.get_response(request)

        # Get the current Host header and X-Forwarded-Host
        current_host = request.META.get("HTTP_HOST", "")
        forwarded_host = request.META.get("HTTP_X_FORWARDED_HOST")

        # If we have X-Forwarded-Host from ALB, use it
        if forwarded_host:
            request.META["HTTP_HOST"] = forwarded_host
            logger.debug(f"Using X-Forwarded-Host: {forwarded_host}")
        # Check if the current host is a valid IP address
        elif current_host:
            # Handle IPv6 addresses in brackets (e.g., "[2001:db8::1]:8000")
            if current_host.startswith("[") and "]" in current_host:
                # IPv6 address with optional port
                bracket_end = current_host.find("]")
                host_without_port = current_host[1:bracket_end]
            else:
                # Determine if this is IPv4 or IPv6 based on colon count
                colon_count = current_host.count(":")

                if colon_count == 0:
                    # No colons - IPv4 without port or hostname
                    host_without_port = current_host
                elif colon_count == 1:
                    # Single colon - IPv4 with port (e.g., "192.168.1.1:8000")
                    host_without_port = current_host.split(":")[0]
                else:
                    # Multiple colons - IPv6 address
                    # IPv6 addresses without brackets rarely have ports appended
                    # but if they do, it's ambiguous - treat whole string as address
                    host_without_port = current_host

            try:
                # Validate if it's an IP address
                ipaddress.ip_address(host_without_port)

                # This is a valid IP address
                x_forwarded_proto = request.META.get("HTTP_X_FORWARDED_PROTO", "http")

                # Log for debugging (debug level, sanitized for production)
                # Only log that we detected an IP-based request, not the actual IP
                logger.debug(
                    f"Request with IP-based Host header detected. "
                    f"Path: {request.path}, "
                    f"X-Forwarded-Proto: {x_forwarded_proto}",
                )

                # For API endpoints, we'll allow the request to proceed
                # Django will validate against ALLOWED_HOSTS which now includes task IPs
                if request.path.startswith("/api/"):
                    logger.debug("Allowing API request with IP-based host")
            except ValueError:
                # Not an IP address, proceed normally
                pass

        # Proceed with normal Django processing
        return self.get_response(request)
