import logging
from typing import Any

from django.http import HttpRequest
from ninja import Router
from ninja.errors import HttpError

from coalition.stakeholders.services import GeocodingService

logger = logging.getLogger(__name__)

# Create router with CSRF disabled for public autocomplete endpoints
router = Router(tags=["Address"])


@router.get("/suggestions", auth=None)
def get_address_suggestions(
    request: HttpRequest,
    q: str,
    limit: int = 5,
) -> dict[str, Any]:
    """
    Get address suggestions for autocomplete.

    Query parameters:
    - q: The search text (required, min 3 characters)
    - limit: Maximum number of suggestions (optional, default 5, max 10)
    """
    query = q.strip()

    if not query or len(query) < 3:
        raise HttpError(400, "Query must be at least 3 characters")

    # Cap limit at 10 suggestions
    limit = min(limit, 10)

    try:
        geocoding_service = GeocodingService()
        suggestions = geocoding_service.get_address_suggestions(query, limit)

        return {
            "suggestions": suggestions,
            "count": len(suggestions),
        }
    except Exception as e:
        logger.error(f"Error getting address suggestions: {e}")
        raise HttpError(500, "Failed to get address suggestions") from e


@router.get("/place/{place_id}", auth=None)
def get_place_details(
    request: HttpRequest,
    place_id: str,
) -> dict[str, str]:
    """
    Get detailed address components for a specific place.

    Path parameters:
    - place_id: The place ID from a suggestion (required)
    """
    if not place_id:
        raise HttpError(400, "place_id is required")

    try:
        geocoding_service = GeocodingService()
        details = geocoding_service.get_place_details(place_id)

        if details:
            return details
        else:
            raise HttpError(404, "Place not found")
    except HttpError:
        raise
    except Exception as e:
        logger.error(f"Error getting place details: {e}")
        raise HttpError(500, "Failed to get place details") from e
