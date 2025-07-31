from django.core.exceptions import ValidationError
from django.test import TestCase

from coalition.content.models import Theme


class ThemeModelTest(TestCase):
    def setUp(self) -> None:
        self.theme_data = {
            "name": "Test Theme",
            "description": "A test theme",
            "primary_color": "#3b82f6",
            "secondary_color": "#64748b",
            "accent_color": "#f59e0b",
            "background_color": "#ffffff",
            "section_background_color": "#f8fafc",
            "card_background_color": "#ffffff",
            "heading_color": "#1f2937",
            "body_text_color": "#374151",
            "muted_text_color": "#6b7280",
            "link_color": "#2563eb",
            "link_hover_color": "#1d4ed8",
            "heading_font_family": "'Merriweather', serif",
            "body_font_family": "'Barlow', sans-serif",
            "google_fonts": ["Merriweather", "Barlow"],
            "font_size_base": 1.0,
            "font_size_small": 0.875,
            "font_size_large": 1.125,
            "custom_css": ".custom { color: red; }",
            "is_active": True,
        }

    def test_create_theme(self) -> None:
        """Test creating a theme with valid data"""
        theme = Theme.objects.create(**self.theme_data)
        assert theme.name == "Test Theme"
        assert theme.description == "A test theme"
        assert theme.primary_color == "#3b82f6"
        assert theme.is_active is True
        assert theme.google_fonts == ["Merriweather", "Barlow"]

    def test_theme_str_representation(self) -> None:
        """Test string representation of theme"""
        theme = Theme.objects.create(**self.theme_data)
        assert str(theme) == "Test Theme (Active)"

        # Test inactive theme
        theme.is_active = False
        theme.save()
        assert str(theme) == "Test Theme"

    def test_only_one_active_theme(self) -> None:
        """Test that only one theme can be active at a time"""
        # Create first active theme
        Theme.objects.create(**self.theme_data)

        # Try to create another active theme
        with self.assertRaises(ValidationError) as context:
            second_theme_data = self.theme_data.copy()
            second_theme_data["name"] = "Second Theme"
            theme2 = Theme(**second_theme_data)
            theme2.full_clean()

        assert "Only one theme can be active at a time" in str(context.exception)

    def test_generate_css_variables_without_google_fonts(self) -> None:
        """Test CSS generation without Google Fonts"""
        theme_data = self.theme_data.copy()
        theme_data["google_fonts"] = []
        theme = Theme.objects.create(**theme_data)

        css = theme.generate_css_variables()

        # Should not contain @import
        assert "@import url" not in css
        # Should contain CSS variables
        assert "--theme-primary: #3b82f6;" in css
        assert "--theme-font-heading: 'Merriweather', serif;" in css

    def test_generate_css_variables_with_google_fonts(self) -> None:
        """Test CSS generation with Google Fonts"""
        theme = Theme.objects.create(**self.theme_data)
        css = theme.generate_css_variables()

        # Should contain @import with both fonts
        assert "@import url" in css
        assert "Merriweather:400,500,600,700" in css
        assert "Barlow:400,500,600,700" in css
        assert "display=swap" in css

        # Should also contain CSS variables
        assert "--theme-primary: #3b82f6;" in css
        assert "--theme-font-heading: 'Merriweather', serif;" in css

    def test_generate_css_variables_with_empty_font_names(self) -> None:
        """Test CSS generation with empty strings in google_fonts"""
        theme_data = self.theme_data.copy()
        theme_data["google_fonts"] = ["Merriweather", "", "  ", "Barlow"]
        theme = Theme.objects.create(**theme_data)

        css = theme.generate_css_variables()

        # Should only include non-empty font names
        assert "Merriweather:400,500,600,700" in css
        assert "Barlow:400,500,600,700" in css
        # Should not have extra separators from empty strings
        assert "&family=&family=" not in css

    def test_generate_css_variables_with_spaces_in_font_names(self) -> None:
        """Test CSS generation with font names containing spaces"""
        theme_data = self.theme_data.copy()
        theme_data["google_fonts"] = ["Open Sans", "Roboto Slab"]
        theme = Theme.objects.create(**theme_data)

        css = theme.generate_css_variables()

        # Spaces should be replaced with +
        assert "Open+Sans:400,500,600,700" in css
        assert "Roboto+Slab:400,500,600,700" in css

    def test_hex_color_validation(self) -> None:
        """Test that invalid hex colors raise validation error"""
        theme_data = self.theme_data.copy()
        theme_data["primary_color"] = "not-a-hex-color"

        with self.assertRaises(ValidationError) as context:
            theme = Theme(**theme_data)
            theme.full_clean()

        assert "Color must be a valid hex code" in str(context.exception)

    def test_get_active_theme(self) -> None:
        """Test getting the active theme"""
        # No active theme initially
        assert Theme.get_active() is None

        # Create active theme
        theme = Theme.objects.create(**self.theme_data)
        assert Theme.get_active() == theme

        # Deactivate theme
        theme.is_active = False
        theme.save()
        assert Theme.get_active() is None
