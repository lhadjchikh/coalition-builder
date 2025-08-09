import hashlib
from collections.abc import Callable
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpRequest, HttpResponse, StreamingHttpResponse
from django.utils.cache import get_conditional_response
from django.utils.http import quote_etag

# Default API prefix - can be overridden in settings
DEFAULT_API_PREFIX = "/api/"


class ETagMiddleware:
    """
    Middleware to automatically add ETag support to all API responses.

    This middleware:
    - Generates ETags based on response content
    - Handles If-None-Match headers for 304 responses
    - Only applies to /api/ endpoints
    - Works with Django Ninja responses
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)

        # Only process API endpoints and successful GET/HEAD requests
        # Skip streaming responses entirely
        api_prefix = getattr(settings, "ETAG_API_PREFIX", DEFAULT_API_PREFIX)
        if (
            request.path.startswith(api_prefix)
            and request.method in ("GET", "HEAD")
            and response.status_code == 200
            and not response.has_header("ETag")
            and not isinstance(response, StreamingHttpResponse)
        ):
            # Generate ETag from response content
            etag = self._generate_etag(request, response)
            response["ETag"] = quote_etag(etag)

            # Set cache headers only if not already set
            if not response.has_header("Cache-Control"):
                response["Cache-Control"] = "private, must-revalidate"

            # Check for conditional response
            conditional_response = get_conditional_response(
                request,
                etag=response.get("ETag"),
                response=response,
            )
            if conditional_response is not None:
                response = conditional_response

        return response

    def _generate_etag(self, request: HttpRequest, response: HttpResponse) -> str:
        """Generate an ETag from response content."""
        # Get content from response (streaming responses are already filtered out)
        content = response.content if hasattr(response, "content") else b""

        # Optimize: Use direct byte concatenation instead of JSON serialization
        # This is much faster for large payloads
        content_type = response.get("Content-Type", "").encode("utf-8")

        # Sort query parameters to ensure deterministic ETag generation
        # This prevents cache misses for semantically identical requests
        if request.GET:
            # Create a canonical representation of query parameters
            # Sort by key, then by value to ensure deterministic ordering
            sorted_params = [
                (key, value)
                for key in sorted(request.GET.keys())
                for value in sorted(request.GET.getlist(key))
            ]
            # Use urlencode to properly handle special characters
            query_params = urlencode(sorted_params).encode("utf-8")
        else:
            query_params = b""

        # Combine all components for hash generation
        hash_input = content + b"|" + content_type + b"|" + query_params

        return hashlib.sha256(hash_input).hexdigest()
