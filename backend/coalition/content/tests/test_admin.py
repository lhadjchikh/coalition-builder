"""Tests for ContentBlock admin interface."""

from unittest.mock import Mock

from django.contrib.admin.sites import AdminSite
from django.test import TestCase

from coalition.content.admin.content_block import ContentBlockAdmin
from coalition.content.models import ContentBlock


class MockRequest:
    """Mock request for admin tests."""

    pass


class ContentBlockAdminTest(TestCase):
    """Test ContentBlockAdmin functionality."""

    def setUp(self) -> None:
        """Set up test data."""
        self.site = AdminSite()
        self.admin = ContentBlockAdmin(ContentBlock, self.site)
        self.request = MockRequest()

    def test_display_title_with_title(self) -> None:
        """Test display_title method with a title."""
        content_block = Mock()
        content_block.title = "Test Title"

        result = self.admin.display_title(content_block)
        assert result == "Test Title"

    def test_display_title_without_title(self) -> None:
        """Test display_title method without a title."""
        content_block = Mock()
        content_block.title = ""
        content_block.get_block_type_display.return_value = "Hero Section"

        result = self.admin.display_title(content_block)
        assert result == "(No title - Hero Section)"

    def test_display_title_with_none_title(self) -> None:
        """Test display_title method with None title."""
        content_block = Mock()
        content_block.title = None
        content_block.get_block_type_display.return_value = "Text Block"

        result = self.admin.display_title(content_block)
        assert result == "(No title - Text Block)"

    def test_has_image_with_image(self) -> None:
        """Test has_image method when image exists."""
        content_block = Mock()
        content_block.image = Mock()  # Mock image object

        result = self.admin.has_image(content_block)
        assert result is True

    def test_has_image_without_image(self) -> None:
        """Test has_image method when image is None."""
        content_block = Mock()
        content_block.image = None

        result = self.admin.has_image(content_block)
        assert result is False

    def test_has_image_with_empty_string(self) -> None:
        """Test has_image method when image is empty string."""
        content_block = Mock()
        content_block.image = ""

        result = self.admin.has_image(content_block)
        assert result is False

    def test_list_display_configuration(self) -> None:
        """Test list_display configuration."""
        expected_fields = (
            "display_title",
            "block_type",
            "page_type",
            "order",
            "is_visible",
            "has_image",
            "created_at",
        )
        assert self.admin.list_display == expected_fields

    def test_list_filter_configuration(self) -> None:
        """Test list_filter configuration."""
        expected_filters = ("block_type", "page_type", "is_visible", "created_at")
        assert self.admin.list_filter == expected_filters

    def test_search_fields_configuration(self) -> None:
        """Test search_fields configuration."""
        expected_fields = ("title", "content")
        assert self.admin.search_fields == expected_fields

    def test_readonly_fields_configuration(self) -> None:
        """Test readonly_fields configuration."""
        expected_fields = ("created_at", "updated_at")
        assert self.admin.readonly_fields == expected_fields

    def test_list_editable_configuration(self) -> None:
        """Test list_editable configuration."""
        expected_fields = ("order", "is_visible")
        assert self.admin.list_editable == expected_fields
