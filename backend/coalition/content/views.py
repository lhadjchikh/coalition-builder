"""Views for content app."""

from django.http import HttpRequest, HttpResponse

from coalition.content.theme_service import ThemeService

from .models import Theme


def theme_css(request: HttpRequest, theme_id: int = None) -> HttpResponse:
    """
    Serve dynamic CSS for a specific theme or the active theme.

    This view generates CSS on-the-fly based on theme configuration.
    Useful for including in HTML templates via <link> tags.

    Usage:
        /theme.css - Serves CSS for the active theme
        /theme/{id}.css - Serves CSS for a specific theme
    """
    if theme_id:
        try:
            theme = Theme.objects.get(id=theme_id)
            return ThemeService.get_theme_css_response(theme)
        except Theme.DoesNotExist:
            # Return empty CSS with no-cache for non-existent themes
            response = HttpResponse("", content_type="text/css")
            response["Cache-Control"] = "no-cache"
            return response
    else:
        theme = Theme.get_active()
        return ThemeService.get_theme_css_response(theme)


def active_theme_css(request: HttpRequest) -> HttpResponse:
    """Serve CSS for the currently active theme"""
    return theme_css(request)
