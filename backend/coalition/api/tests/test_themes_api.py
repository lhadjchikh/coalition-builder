"""Tests for the themes API endpoints."""

from django.test import TestCase

from coalition.content.models import Theme


class ThemeAPITest(TestCase):
    def setUp(self) -> None:
        """Set up test data."""
        # Deactivate any existing themes first
        Theme.objects.filter(is_active=True).update(is_active=False)

        self.theme_with_fonts = Theme.objects.create(
            name="Test Theme with Fonts",
            description="A theme with Google Fonts",
            primary_color="#4A7C59",
            secondary_color="#2B5F87",
            accent_color="#F4A460",
            heading_font_family="'Merriweather', serif",
            body_font_family="'Barlow', sans-serif",
            google_fonts=["Merriweather", "Barlow"],
            is_active=True,
        )

        self.theme_without_fonts = Theme.objects.create(
            name="Test Theme without Fonts",
            description="A theme without Google Fonts",
            primary_color="#333333",
            google_fonts=[],
            is_active=False,
        )

    def test_active_theme_css_endpoint_includes_google_fonts(self) -> None:
        """Test that the active theme CSS endpoint includes Google Fonts @import."""
        url = "/api/themes/active/css/"
        response = self.client.get(url)

        assert response.status_code == 200
        data = response.json()

        # Check that CSS variables are returned
        assert "css_variables" in data
        css_content = data["css_variables"]

        # Check that Google Fonts @import is included with proper URL
        assert "@import url(" in css_content
        assert "https://fonts.googleapis.com/css2?" in css_content
        assert "Merriweather" in css_content
        assert "Barlow" in css_content
        assert "family=Merriweather:400,500,600,700" in css_content
        assert "family=Barlow:400,500,600,700" in css_content

        # Check that CSS variables are included
        assert "--theme-primary: #4A7C59;" in css_content
        assert "--theme-font-heading: 'Merriweather', serif;" in css_content
        assert "--theme-font-body: 'Barlow', sans-serif;" in css_content

    def test_theme_css_endpoint_without_google_fonts(self) -> None:
        """Test that themes without Google Fonts don't include @import."""
        # Make the theme without fonts active
        self.theme_with_fonts.is_active = False
        self.theme_with_fonts.save()
        self.theme_without_fonts.is_active = True
        self.theme_without_fonts.save()

        url = "/api/themes/active/css/"
        response = self.client.get(url)

        assert response.status_code == 200
        data = response.json()

        css_content = data["css_variables"]

        # Should not include @import
        assert "@import url(" not in css_content
        assert "https://fonts.googleapis.com/css2?" not in css_content

        # But should still have CSS variables
        assert "--theme-primary: #333333;" in css_content

    def test_specific_theme_css_endpoint(self) -> None:
        """Test getting CSS for a specific theme by ID."""
        url = f"/api/themes/{self.theme_with_fonts.id}/css/"
        response = self.client.get(url)

        assert response.status_code == 200
        data = response.json()

        css_content = data["css_variables"]
        assert "@import url(" in css_content
        assert "https://fonts.googleapis.com/css2?" in css_content
        assert "Merriweather" in css_content

    def test_theme_css_with_spaces_in_font_names(self) -> None:
        """Test that font names with spaces are handled correctly."""
        # Deactivate current theme
        Theme.objects.filter(is_active=True).update(is_active=False)

        Theme.objects.create(
            name="Theme with Spaced Fonts",
            google_fonts=["Open Sans", "Roboto Slab"],
            is_active=True,
        )

        url = "/api/themes/active/css/"
        response = self.client.get(url)

        data = response.json()
        css_content = data["css_variables"]

        # Spaces should be replaced with +
        assert "Open+Sans:400,500,600,700" in css_content
        assert "Roboto+Slab:400,500,600,700" in css_content

    def test_theme_css_with_empty_font_strings(self) -> None:
        """Test that empty strings in google_fonts are filtered out."""
        # Deactivate current theme
        Theme.objects.filter(is_active=True).update(is_active=False)

        Theme.objects.create(
            name="Theme with Empty Fonts",
            google_fonts=["Lato", "", "  ", "Montserrat"],
            is_active=True,
        )

        url = "/api/themes/active/css/"
        response = self.client.get(url)

        data = response.json()
        css_content = data["css_variables"]

        # Should include non-empty fonts
        assert "Lato:400,500,600,700" in css_content
        assert "Montserrat:400,500,600,700" in css_content

        # Should not have extra separators
        assert "&family=&family=" not in css_content

    def test_no_active_theme_returns_empty_css(self) -> None:
        """Test that when no theme is active, empty CSS is returned."""
        # Deactivate all themes
        Theme.objects.update(is_active=False)

        url = "/api/themes/active/css/"
        response = self.client.get(url)

        assert response.status_code == 200
        data = response.json()

        assert data["css_variables"] == ""
        assert data["custom_css"] is None
