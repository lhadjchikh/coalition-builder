import json

from django.test import TestCase
from django.test.client import Client

from coalition.content.models import Theme


class ThemeAPITest(TestCase):
    def setUp(self) -> None:
        """Set up test data"""
        self.client = Client()

        # Create test themes
        self.active_theme = Theme.objects.create(
            name="Active Test Theme",
            description="An active theme for testing",
            primary_color="#2563eb",
            secondary_color="#64748b",
            accent_color="#f59e0b",
            background_color="#ffffff",
            section_background_color="#f8fafc",
            card_background_color="#ffffff",
            heading_color="#1e293b",
            body_text_color="#334155",
            muted_text_color="#64748b",
            link_color="#2563eb",
            link_hover_color="#1d4ed8",
            heading_font_family="'Merriweather', serif",
            body_font_family="'Barlow', sans-serif",
            google_fonts=["Merriweather", "Barlow"],
            font_size_base=1.00,
            font_size_small=0.875,
            font_size_large=1.125,
            logo_alt_text="Test Logo",
            custom_css=".custom { color: red; }",
            is_active=True,
        )

        self.inactive_theme = Theme.objects.create(
            name="Inactive Test Theme",
            description="An inactive theme for testing",
            primary_color="#059669",
            secondary_color="#6b7280",
            heading_font_family="'Open Sans', sans-serif",
            body_font_family="'Roboto', sans-serif",
            google_fonts=["Open Sans", "Roboto"],
            is_active=False,
        )

    def test_list_themes(self) -> None:
        """Test GET /api/themes/ returns all themes"""
        response = self.client.get("/api/themes/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

        # Check that google_fonts field is included
        theme_names = {theme["name"] for theme in data}
        assert "Active Test Theme" in theme_names
        assert "Inactive Test Theme" in theme_names

        # Find the active theme and check google_fonts field
        active_theme_data = next(t for t in data if t["name"] == "Active Test Theme")
        assert active_theme_data["google_fonts"] == ["Merriweather", "Barlow"]
        assert active_theme_data["heading_font_family"] == "'Merriweather', serif"
        assert active_theme_data["body_font_family"] == "'Barlow', sans-serif"

    def test_get_active_theme(self) -> None:
        """Test GET /api/themes/active/ returns the active theme"""
        response = self.client.get("/api/themes/active/")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == self.active_theme.id
        assert data["name"] == "Active Test Theme"
        assert data["is_active"] is True
        assert data["google_fonts"] == ["Merriweather", "Barlow"]
        assert data["heading_font_family"] == "'Merriweather', serif"
        assert data["body_font_family"] == "'Barlow', sans-serif"

    def test_get_active_theme_none(self) -> None:
        """Test GET /api/themes/active/ when no theme is active"""
        # Deactivate all themes
        Theme.objects.filter(is_active=True).update(is_active=False)

        response = self.client.get("/api/themes/active/")

        assert response.status_code == 200
        assert response.json() is None

    def test_get_theme_by_id(self) -> None:
        """Test GET /api/themes/{id}/ returns specific theme"""
        response = self.client.get(f"/api/themes/{self.active_theme.id}/")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == self.active_theme.id
        assert data["name"] == "Active Test Theme"
        assert data["google_fonts"] == ["Merriweather", "Barlow"]
        assert data["custom_css"] == ".custom { color: red; }"

    def test_get_theme_not_found(self) -> None:
        """Test GET /api/themes/{id}/ with non-existent ID"""
        response = self.client.get("/api/themes/999/")

        assert response.status_code == 404

    def test_get_theme_css(self) -> None:
        """Test GET /api/themes/{id}/css/ returns CSS variables"""
        response = self.client.get(f"/api/themes/{self.active_theme.id}/css/")

        assert response.status_code == 200
        data = response.json()

        assert "css_variables" in data
        assert "custom_css" in data
        assert data["custom_css"] == ".custom { color: red; }"

        # Check that CSS variables include font families
        css_vars = data["css_variables"]
        assert "--theme-font-heading: 'Merriweather', serif;" in css_vars
        assert "--theme-font-body: 'Barlow', sans-serif;" in css_vars

    def test_get_active_theme_css(self) -> None:
        """Test GET /api/themes/active/css/ returns active theme CSS"""
        response = self.client.get("/api/themes/active/css/")

        assert response.status_code == 200
        data = response.json()

        assert "css_variables" in data
        assert "custom_css" in data

        # Should match the active theme
        css_vars = data["css_variables"]
        assert "--theme-font-heading: 'Merriweather', serif;" in css_vars

    def test_create_theme(self) -> None:
        """Test POST /api/themes/ creates a new theme"""
        theme_data = {
            "name": "New Test Theme",
            "description": "A newly created theme",
            "primary_color": "#dc2626",
            "secondary_color": "#71717a",
            "heading_font_family": "'Playfair Display', serif",
            "body_font_family": "'Inter', sans-serif",
            "google_fonts": ["Playfair Display", "Inter"],
        }

        response = self.client.post(
            "/api/themes/",
            data=json.dumps(theme_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "New Test Theme"
        assert data["google_fonts"] == ["Playfair Display", "Inter"]
        assert data["heading_font_family"] == "'Playfair Display', serif"
        assert data["body_font_family"] == "'Inter', sans-serif"
        assert data["is_active"] is False  # New themes default to inactive

    def test_create_theme_with_empty_google_fonts(self) -> None:
        """Test creating theme with empty google_fonts list"""
        theme_data = {
            "name": "System Font Theme",
            "google_fonts": [],  # Empty list
        }

        response = self.client.post(
            "/api/themes/",
            data=json.dumps(theme_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "System Font Theme"
        assert data["google_fonts"] == []

    def test_update_theme(self) -> None:
        """Test PUT /api/themes/{id}/ updates a theme"""
        update_data = {
            "name": "Updated Theme Name",
            "google_fonts": ["Nunito", "Source Sans Pro"],
            "heading_font_family": "'Nunito', sans-serif",
            "body_font_family": "'Source Sans Pro', sans-serif",
        }

        response = self.client.put(
            f"/api/themes/{self.inactive_theme.id}/",
            data=json.dumps(update_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "Updated Theme Name"
        assert data["google_fonts"] == ["Nunito", "Source Sans Pro"]
        assert data["heading_font_family"] == "'Nunito', sans-serif"

    def test_activate_theme(self) -> None:
        """Test PATCH /api/themes/{id}/activate/ activates a theme"""
        # Ensure inactive theme is inactive
        assert self.inactive_theme.is_active is False

        response = self.client.patch(f"/api/themes/{self.inactive_theme.id}/activate/")

        assert response.status_code == 200
        data = response.json()

        assert data["is_active"] is True

        # Refresh from database
        self.inactive_theme.refresh_from_db()
        self.active_theme.refresh_from_db()

        # Check that only the activated theme is active
        assert self.inactive_theme.is_active is True
        assert self.active_theme.is_active is False

    def test_delete_theme(self) -> None:
        """Test DELETE /api/themes/{id}/ deletes an inactive theme"""
        theme_id = self.inactive_theme.id

        response = self.client.delete(f"/api/themes/{theme_id}/")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Theme deleted successfully"

        # Verify theme is deleted
        assert Theme.objects.filter(id=theme_id).exists() is False

    def test_delete_active_theme_forbidden(self) -> None:
        """Test DELETE /api/themes/{id}/ prevents deleting active theme"""
        response = self.client.delete(f"/api/themes/{self.active_theme.id}/")

        assert response.status_code == 400
        data = response.json()
        assert "Cannot delete the active theme" in data["detail"]

        # Verify theme still exists
        assert Theme.objects.filter(id=self.active_theme.id).exists() is True

    def test_invalid_color_format(self) -> None:
        """Test that invalid color formats are rejected"""
        theme_data = {
            "name": "Invalid Color Theme",
            "primary_color": "blue",  # Invalid - not hex
        }

        response = self.client.post(
            "/api/themes/",
            data=json.dumps(theme_data),
            content_type="application/json",
        )

        assert response.status_code == 422  # Validation error

    def test_google_fonts_field_validation(self) -> None:
        """Test that google_fonts accepts list of strings"""
        theme_data = {
            "name": "Font Validation Theme",
            "google_fonts": ["Valid Font", "Another Font"],
        }

        response = self.client.post(
            "/api/themes/",
            data=json.dumps(theme_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["google_fonts"] == ["Valid Font", "Another Font"]
