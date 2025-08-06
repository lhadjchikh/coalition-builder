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
            # Remove port if present (e.g., "192.168.1.1:8000" -> "192.168.1.1")
            host_without_port = current_host.split(":")[0]
            try:
                # Validate if it's an IP address
                ipaddress.ip_address(host_without_port)

                # This is a valid IP address
                x_forwarded_proto = request.META.get("HTTP_X_FORWARDED_PROTO", "http")

                # Log this for debugging
                logger.warning(
                    f"Request with IP Host header: {current_host}, "
                    f"Path: {request.path}, "
                    f"X-Forwarded-Proto: {x_forwarded_proto}",
                )

                # For API endpoints, we'll allow the request to proceed
                # Django will validate against ALLOWED_HOSTS which now includes task IPs
                if request.path.startswith("/api/"):
                    logger.info(f"Allowing API request with IP host: {current_host}")
            except ValueError:
                # Not an IP address, proceed normally
                pass

        # Proceed with normal Django processing
        return self.get_response(request)
