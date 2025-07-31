"""Tests for HomePage admin interface."""

from unittest.mock import Mock

from django.contrib.admin.sites import AdminSite
from django.test import TestCase

from coalition.content.admin.homepage import HomePageAdmin
from coalition.content.models import HomePage


class MockRequest:
    """Mock request for admin tests."""

    pass


class HomePageAdminTest(TestCase):
    """Test HomePageAdmin functionality."""

    def setUp(self) -> None:
        """Set up test data."""
        self.site = AdminSite()
        self.admin = HomePageAdmin(HomePage, self.site)
        self.request = MockRequest()

    def test_list_display_configuration(self) -> None:
        """Test list_display configuration."""
        expected_fields = (
            "organization_name",
            "theme",
            "is_active",
            "has_hero_image",
            "has_hero_video",
            "created_at",
            "updated_at",
        )
        assert self.admin.list_display == expected_fields

    def test_list_filter_configuration(self) -> None:
        """Test list_filter configuration."""
        expected_filters = ("theme", "is_active", "created_at")
        assert self.admin.list_filter == expected_filters

    def test_search_fields_configuration(self) -> None:
        """Test search_fields configuration."""
        expected_fields = ("organization_name", "tagline", "hero_title")
        assert self.admin.search_fields == expected_fields

    def test_readonly_fields_configuration(self) -> None:
        """Test readonly_fields configuration."""
        expected_fields = ("created_at", "updated_at")
        assert self.admin.readonly_fields == expected_fields

    def test_has_hero_image_with_image(self) -> None:
        """Test has_hero_image method when image exists."""
        homepage = Mock()
        homepage.hero_background_image = Mock()  # Mock image object

        result = self.admin.has_hero_image(homepage)
        assert result is True

    def test_has_hero_image_without_image(self) -> None:
        """Test has_hero_image method when image is None."""
        homepage = Mock()
        homepage.hero_background_image = None

        result = self.admin.has_hero_image(homepage)
        assert result is False

    def test_has_hero_video_with_video(self) -> None:
        """Test has_hero_video method when video exists."""
        homepage = Mock()
        homepage.hero_background_video = Mock()  # Mock video object

        result = self.admin.has_hero_video(homepage)
        assert result is True

    def test_has_hero_video_without_video(self) -> None:
        """Test has_hero_video method when video is None."""
        homepage = Mock()
        homepage.hero_background_video = None

        result = self.admin.has_hero_video(homepage)
        assert result is False

    def test_fieldsets_configuration(self) -> None:
        """Test that fieldsets are properly configured."""
        assert len(self.admin.fieldsets) == 7

        # Test first fieldset (general info)
        assert self.admin.fieldsets[0][0] is None
        assert "organization_name" in self.admin.fieldsets[0][1]["fields"]

        # Test hero section fieldset
        assert self.admin.fieldsets[1][0] == "Hero Section"
        assert "hero_title" in self.admin.fieldsets[1][1]["fields"]
        assert "description" in self.admin.fieldsets[1][1]

        # Test collapsible fieldsets
        assert self.admin.fieldsets[2][0] == "Hero Overlay Settings"
        assert "collapse" in self.admin.fieldsets[2][1].get("classes", ())

        assert self.admin.fieldsets[5][0] == "Social Media"
        assert "collapse" in self.admin.fieldsets[5][1].get("classes", ())
