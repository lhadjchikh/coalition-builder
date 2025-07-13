from django.http import HttpRequest, HttpResponse
from django.test import TestCase

from coalition.content.models import Theme
from coalition.content.views import active_theme_css, theme_css


class ContentViewsTest(TestCase):
    """Test content app views."""

    def setUp(self) -> None:
        """Set up test data."""
        self.theme = Theme.objects.create(
            name="Test Theme",
            primary_color="#3b82f6",
            custom_css=".test { color: red; }",
            is_active=True,
        )
        self.inactive_theme = Theme.objects.create(
            name="Inactive Theme",
            primary_color="#000000",
            custom_css=".inactive { color: blue; }",
            is_active=False,
        )

    def test_theme_css_with_active_theme(self) -> None:
        """Test theme_css view with no theme_id (uses active theme)."""
        request = HttpRequest()
        response = theme_css(request)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        assert ".test { color: red; }" in response.content.decode()

    def test_theme_css_with_specific_theme_id(self) -> None:
        """Test theme_css view with specific theme_id."""
        request = HttpRequest()
        response = theme_css(request, theme_id=self.inactive_theme.id)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        assert ".inactive { color: blue; }" in response.content.decode()

    def test_theme_css_with_nonexistent_theme_id(self) -> None:
        """Test theme_css view with non-existent theme_id."""
        request = HttpRequest()
        response = theme_css(request, theme_id=99999)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        # Should return no-cache response for non-existent theme
        assert response["Cache-Control"] == "no-cache"
        # Should return empty content for non-existent theme
        assert response.content.decode() == ""

    def test_active_theme_css(self) -> None:
        """Test active_theme_css view."""
        request = HttpRequest()
        response = active_theme_css(request)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        assert ".test { color: red; }" in response.content.decode()

    def test_theme_css_no_active_theme(self) -> None:
        """Test theme_css when no theme is active."""
        # Deactivate all themes
        Theme.objects.update(is_active=False)

        request = HttpRequest()
        response = theme_css(request)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        assert response["Cache-Control"] == "no-cache"
