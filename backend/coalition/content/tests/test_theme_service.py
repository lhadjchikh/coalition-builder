from unittest.mock import Mock, patch

from django.http import HttpResponse
from django.test import TestCase

from coalition.content.models import Theme
from coalition.content.theme_service import ThemeService


class ThemeServiceSimpleTest(TestCase):
    """Simple tests for ThemeService to improve coverage."""

    def setUp(self) -> None:
        """Set up test data."""
        self.theme = Theme.objects.create(
            name="Test Theme",
            primary_color="#3b82f6",
            custom_css=".test { color: red; }",
            is_active=True,
        )

    def test_get_theme_css_response_with_theme(self) -> None:
        """Test CSS response generation with a valid theme."""
        response = ThemeService.get_theme_css_response(self.theme)

        assert isinstance(response, HttpResponse)
        assert response["Content-Type"] == "text/css"
        assert "Cache-Control" in response
        assert "ETag" in response

    def test_get_theme_css_response_no_theme(self) -> None:
        """Test CSS response when no theme is provided."""
        with patch.object(Theme, "get_active", return_value=None):
            response = ThemeService.get_theme_css_response(None)

            assert isinstance(response, HttpResponse)
            assert response["Content-Type"] == "text/css"
            assert response["Cache-Control"] == "no-cache"

    def test_generate_theme_css(self) -> None:
        """Test CSS generation."""
        css = ThemeService.generate_theme_css(self.theme)

        assert isinstance(css, str)
        assert len(css) > 0
        assert "--theme-primary" in css
        assert ".test { color: red; }" in css

    def test_generate_utility_classes(self) -> None:
        """Test utility classes generation."""
        css = ThemeService.generate_utility_classes()

        assert isinstance(css, str)
        assert len(css) > 0
        assert "theme-primary" in css

    def test_get_theme_for_homepage(self) -> None:
        """Test theme resolution for homepage."""
        homepage_mock = Mock()
        homepage_mock.theme = self.theme

        result = ThemeService.get_theme_for_homepage(homepage_mock)
        assert result == self.theme

    def test_get_theme_for_homepage_fallback(self) -> None:
        """Test theme resolution fallback."""
        homepage_mock = Mock()
        homepage_mock.theme = None

        with patch.object(Theme, "get_active", return_value=self.theme):
            result = ThemeService.get_theme_for_homepage(homepage_mock)
            assert result == self.theme

    def test_apply_theme_to_component_props(self) -> None:
        """Test component props generation."""
        props = ThemeService.apply_theme_to_component_props(self.theme)

        assert isinstance(props, dict)
        assert "theme" in props
        assert "colors" in props["theme"]
        assert props["theme"]["colors"]["primary"] == "#3b82f6"

    def test_apply_theme_to_component_props_none(self) -> None:
        """Test component props with None theme."""
        props = ThemeService.apply_theme_to_component_props(None)
        assert props == {}
