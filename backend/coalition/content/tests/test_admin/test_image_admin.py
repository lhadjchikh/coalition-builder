"""Tests for Image admin interface."""

from unittest.mock import Mock

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import TestCase

from coalition.content.admin.image import ImageAdmin
from coalition.content.models import Image

User = get_user_model()


class MockRequest:
    """Mock request for admin tests."""

    def __init__(self, user: User | None = None) -> None:
        self.user = user or Mock()


class ImageAdminTest(TestCase):
    """Test ImageAdmin functionality."""

    def setUp(self) -> None:
        """Set up test data."""
        self.site = AdminSite()
        self.admin = ImageAdmin(Image, self.site)
        self.user = User.objects.create_user(username="testuser")
        self.request = MockRequest(user=self.user)

    def test_list_display_configuration(self) -> None:
        """Test list_display configuration."""
        expected_fields = (
            "title",
            "image_type",
            "author",
            "license",
            "uploaded_by",
            "created_at",
        )
        assert self.admin.list_display == expected_fields

    def test_list_filter_configuration(self) -> None:
        """Test list_filter configuration."""
        expected_filters = ("image_type", "license", "created_at", "uploaded_by")
        assert self.admin.list_filter == expected_filters

    def test_search_fields_configuration(self) -> None:
        """Test search_fields configuration."""
        expected_fields = ("title", "alt_text", "description", "author")
        assert self.admin.search_fields == expected_fields

    def test_readonly_fields_configuration(self) -> None:
        """Test readonly_fields configuration."""
        expected_fields = ("created_at", "updated_at", "uploaded_by")
        assert self.admin.readonly_fields == expected_fields

    def test_fieldsets_configuration(self) -> None:
        """Test that fieldsets are properly configured."""
        assert len(self.admin.fieldsets) == 3

        # Test image information fieldset
        assert self.admin.fieldsets[0][0] == "Image Information"
        assert "image" in self.admin.fieldsets[0][1]["fields"]
        assert "title" in self.admin.fieldsets[0][1]["fields"]

        # Test attribution fieldset
        assert self.admin.fieldsets[1][0] == "Attribution & Licensing"
        assert "author" in self.admin.fieldsets[1][1]["fields"]
        assert "license" in self.admin.fieldsets[1][1]["fields"]

        # Test metadata fieldset
        assert self.admin.fieldsets[2][0] == "Metadata"
        assert "collapse" in self.admin.fieldsets[2][1].get("classes", ())

    def test_save_model_sets_uploaded_by_on_create(self) -> None:
        """Test that save_model sets uploaded_by on creation."""
        obj = Mock(spec=Image)
        form = Mock()

        # Test creation (change=False)
        self.admin.save_model(self.request, obj, form, change=False)
        assert obj.uploaded_by == self.user

    def test_save_model_preserves_uploaded_by_on_update(self) -> None:
        """Test that save_model doesn't change uploaded_by on update."""
        obj = Mock(spec=Image)
        obj.uploaded_by = Mock()  # Existing user
        original_user = obj.uploaded_by
        form = Mock()

        # Test update (change=True)
        self.admin.save_model(self.request, obj, form, change=True)
        assert obj.uploaded_by == original_user  # Should not change
