import hashlib
import json
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse
from django.utils.cache import get_conditional_response
from django.utils.http import quote_etag


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
        if (
            request.path.startswith("/api/")
            and request.method in ("GET", "HEAD")
            and response.status_code == 200
            and not response.has_header("ETag")
        ):
            # Generate ETag from response content
            etag = self._generate_etag(response)
            response["ETag"] = quote_etag(etag)

            # Set cache headers
            if not response.has_header("Cache-Control"):
                response["Cache-Control"] = "private, must-revalidate"

            # Check for conditional response
            response = get_conditional_response(
                request,
                etag=response.get("ETag"),
                response=response,
            )

        return response

    def _generate_etag(self, response: HttpResponse) -> str:
        """Generate an ETag from response content."""
        if hasattr(response, "content"):
            # For regular HttpResponse/JsonResponse
            content = response.content
        else:
            # For streaming responses
            content = b"".join(response)

        # Include content type in ETag to handle different representations
        etag_data = {
            "content": (
                content.decode("utf-8") if isinstance(content, bytes) else str(content)
            ),
            "content_type": response.get("Content-Type", ""),
        }

        # Generate hash
        content_str = json.dumps(etag_data, sort_keys=True, default=str)
        return hashlib.sha256(content_str.encode()).hexdigest()
