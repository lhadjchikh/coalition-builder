"""Tests for Theme admin interface."""

from django.contrib.admin.sites import AdminSite
from django.test import TestCase

from coalition.content.admin.theme import ThemeAdmin
from coalition.content.models import Theme


class MockRequest:
    """Mock request for admin tests."""

    pass


class ThemeAdminTest(TestCase):
    """Test ThemeAdmin functionality."""

    def setUp(self) -> None:
        """Set up test data."""
        self.site = AdminSite()
        self.admin = ThemeAdmin(Theme, self.site)
        self.request = MockRequest()

    def test_save_as_enabled(self) -> None:
        """Test that save_as is enabled."""
        assert self.admin.save_as is True

    def test_save_as_continue_enabled(self) -> None:
        """Test that save_as_continue is enabled."""
        assert self.admin.save_as_continue is True

    def test_list_display_configuration(self) -> None:
        """Test list_display configuration."""
        expected_fields = ("name", "description", "is_active", "created_at")
        assert self.admin.list_display == expected_fields

    def test_list_filter_configuration(self) -> None:
        """Test list_filter configuration."""
        expected_filters = ("is_active", "created_at")
        assert self.admin.list_filter == expected_filters

    def test_search_fields_configuration(self) -> None:
        """Test search_fields configuration."""
        expected_fields = ("name", "description")
        assert self.admin.search_fields == expected_fields

    def test_readonly_fields_configuration(self) -> None:
        """Test readonly_fields configuration."""
        expected_fields = ("created_at", "updated_at")
        assert self.admin.readonly_fields == expected_fields

    def test_fieldsets_configuration(self) -> None:
        """Test that fieldsets are properly configured."""
        assert len(self.admin.fieldsets) == 8

        # Test first fieldset (general info)
        assert self.admin.fieldsets[0][0] is None
        assert "name" in self.admin.fieldsets[0][1]["fields"]
        assert "description" in self.admin.fieldsets[0][1]["fields"]
        assert "is_active" in self.admin.fieldsets[0][1]["fields"]

        # Test color fieldsets
        assert self.admin.fieldsets[1][0] == "Primary Colors"
        assert self.admin.fieldsets[2][0] == "Background Colors"
        assert self.admin.fieldsets[3][0] == "Text Colors"

        # Test typography fieldset
        assert self.admin.fieldsets[4][0] == "Typography"
        assert "google_fonts" in self.admin.fieldsets[4][1]["fields"]

        # Test brand assets fieldset
        assert self.admin.fieldsets[5][0] == "Brand Assets"

        # Test custom styling fieldset
        assert self.admin.fieldsets[6][0] == "Custom Styling"
        assert "collapse" in self.admin.fieldsets[6][1].get("classes", ())

        # Test metadata fieldset
        assert self.admin.fieldsets[7][0] == "Metadata"
        assert "collapse" in self.admin.fieldsets[7][1].get("classes", ())
