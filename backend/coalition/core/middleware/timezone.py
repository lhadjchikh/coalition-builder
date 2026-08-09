"""Request-local timezone activation for Django's admin site."""

from collections.abc import Callable

from django.http import HttpRequest, HttpResponse
from django.utils import timezone

from coalition.core.models import SiteConfiguration


class AdminTimezoneMiddleware:
    """Render admin requests in the configured site timezone."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if not request.path_info.startswith("/admin/"):
            return self.get_response(request)

        with timezone.override(SiteConfiguration.get_timezone()):
            return self.get_response(request)
