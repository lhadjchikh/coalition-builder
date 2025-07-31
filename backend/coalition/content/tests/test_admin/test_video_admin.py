"""Tests for Video admin interface."""

from unittest.mock import Mock

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import TestCase

from coalition.content.admin.video import VideoAdmin
from coalition.content.models import Video

User = get_user_model()


class MockRequest:
    """Mock request for admin tests."""

    def __init__(self, user: User | None = None) -> None:
        self.user = user or Mock()


class VideoAdminTest(TestCase):
    """Test VideoAdmin functionality."""

    def setUp(self) -> None:
        """Set up test data."""
        self.site = AdminSite()
        self.admin = VideoAdmin(Video, self.site)
        self.user = User.objects.create_user(username="testuser")
        self.request = MockRequest(user=self.user)

    def test_list_display_configuration(self) -> None:
        """Test list_display configuration."""
        expected_fields = (
            "title",
            "video_type",
            "display_video_file",
            "autoplay",
            "loop",
            "muted",
            "show_controls",
            "uploaded_by",
            "created_at",
        )
        assert self.admin.list_display == expected_fields

    def test_list_filter_configuration(self) -> None:
        """Test list_filter configuration."""
        expected_filters = ("video_type", "autoplay", "loop", "muted", "created_at")
        assert self.admin.list_filter == expected_filters

    def test_search_fields_configuration(self) -> None:
        """Test search_fields configuration."""
        expected_fields = ("title", "alt_text", "description", "author", "license")
        assert self.admin.search_fields == expected_fields

    def test_readonly_fields_configuration(self) -> None:
        """Test readonly_fields configuration."""
        expected_fields = ("created_at", "updated_at", "display_video_preview")
        assert self.admin.readonly_fields == expected_fields

    def test_raw_id_fields_configuration(self) -> None:
        """Test raw_id_fields configuration."""
        expected_fields = ("uploaded_by",)
        assert self.admin.raw_id_fields == expected_fields

    def test_fieldsets_configuration(self) -> None:
        """Test that fieldsets are properly configured."""
        assert len(self.admin.fieldsets) == 4

        # Test main fieldset
        assert self.admin.fieldsets[0][0] is None
        assert "video" in self.admin.fieldsets[0][1]["fields"]
        assert "display_video_preview" in self.admin.fieldsets[0][1]["fields"]

        # Test video settings fieldset
        assert self.admin.fieldsets[1][0] == "Video Settings"
        assert "autoplay" in self.admin.fieldsets[1][1]["fields"]
        assert "description" in self.admin.fieldsets[1][1]

        # Test collapsible fieldsets
        assert self.admin.fieldsets[2][0] == "Attribution"
        assert "collapse" in self.admin.fieldsets[2][1].get("classes", ())

        assert self.admin.fieldsets[3][0] == "Metadata"
        assert "collapse" in self.admin.fieldsets[3][1].get("classes", ())

    def test_display_video_file_with_video(self) -> None:
        """Test display_video_file when video exists."""
        obj = Mock(spec=Video)
        obj.video = Mock()
        obj.video.name = "path/to/my_video.mp4"

        result = self.admin.display_video_file(obj)
        assert result == "my_video.mp4"

    def test_display_video_file_without_video(self) -> None:
        """Test display_video_file when video is None."""
        obj = Mock(spec=Video)
        obj.video = None

        result = self.admin.display_video_file(obj)
        assert result == "-"

    def test_display_video_preview_with_video(self) -> None:
        """Test display_video_preview when video exists."""
        obj = Mock(spec=Video)
        obj.video = Mock()
        obj.video.url = "https://example.com/video.mp4"

        result = self.admin.display_video_preview(obj)
        assert '<video width="320" height="240" controls>' in result
        assert 'src="https://example.com/video.mp4"' in result

    def test_display_video_preview_without_video(self) -> None:
        """Test display_video_preview when video is None."""
        obj = Mock(spec=Video)
        obj.video = None

        result = self.admin.display_video_preview(obj)
        assert result == "No video uploaded"

    def test_save_model_sets_uploaded_by_when_not_set(self) -> None:
        """Test that save_model sets uploaded_by when not set."""
        obj = Mock(spec=Video)
        obj.uploaded_by = None
        form = Mock()

        self.admin.save_model(self.request, obj, form, change=False)
        assert obj.uploaded_by == self.user

    def test_save_model_preserves_uploaded_by_when_set(self) -> None:
        """Test that save_model preserves uploaded_by when already set."""
        obj = Mock(spec=Video)
        existing_user = Mock()
        obj.uploaded_by = existing_user
        form = Mock()

        self.admin.save_model(self.request, obj, form, change=True)
        assert obj.uploaded_by == existing_user  # Should not change
