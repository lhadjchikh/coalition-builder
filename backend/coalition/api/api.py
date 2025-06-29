from django.http import HttpRequest, JsonResponse
from ninja import NinjaAPI

from coalition.core.views import health_check as health_check_view

from . import (
    campaigns,
    content_blocks,
    endorsements,
    homepage,
    legislators,
    stakeholders,
    themes,
)

# Enable CSRF protection for all endpoints by default
# This protects admin endpoints from CSRF attacks
api = NinjaAPI(version="1.0", csrf=True)

api.add_router("/campaigns/", campaigns.router)
api.add_router("/stakeholders/", stakeholders.router)
api.add_router("/endorsements/", endorsements.router)
api.add_router("/legislators/", legislators.router)
api.add_router("/homepage/", homepage.router)
api.add_router("/content-blocks/", content_blocks.router)
api.add_router("/themes/", themes.router)


@api.get("/health/", tags=["Health"])
def api_health_check(request: HttpRequest) -> JsonResponse:
    """Health check endpoint for API monitoring and external tools"""
    # Re-use the Django view health check function
    return health_check_view(request)
