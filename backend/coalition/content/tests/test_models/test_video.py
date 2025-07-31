from typing import Any
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from coalition.content.models import Video


@patch("coalition.core.storage.MediaStorage.save")
@patch("coalition.core.storage.MediaStorage.exists")
class VideoModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass",
        )

        # Create a simple video file for testing
        self.video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        self.video_data = {
            "video": self.video_file,
            "title": "Test Video",
            "alt_text": "A test video",
            "description": "Description of test video",
            "author": "Test Author",
            "license": "CC BY 4.0",
            "source_url": "https://example.com/video",
            "video_type": "hero",
            "uploaded_by": self.user,
        }

    def _setup_storage_mocks(self, mock_exists: Any, mock_save: Any) -> None:
        """Configure storage mocks for tests."""
        mock_exists.return_value = False
        # Return a path based on the file being saved
        mock_save.side_effect = lambda name, _, **_kwargs: f"videos/{name}"

    def test_create_video(self, mock_exists: Any, mock_save: Any) -> None:
        """Test creating a video with valid data"""
        self._setup_storage_mocks(mock_exists, mock_save)
        video = Video.objects.create(**self.video_data)
        assert video.title == "Test Video"
        assert video.alt_text == "A test video"
        assert video.description == "Description of test video"
        assert video.author == "Test Author"
        assert video.license == "CC BY 4.0"
        assert video.source_url == "https://example.com/video"
        assert video.video_type == "hero"
        assert video.uploaded_by == self.user
        assert video.autoplay is True  # default
        assert video.loop is True  # default
        assert video.muted is True  # default
        assert video.show_controls is False  # default

    def test_video_str_representation(self, mock_exists: Any, mock_save: Any) -> None:
        """Test string representation of video"""
        self._setup_storage_mocks(mock_exists, mock_save)
        video = Video.objects.create(**self.video_data)
        assert str(video) == "Test Video"

    def test_video_url_property(self, mock_exists: Any, mock_save: Any) -> None:
        """Test video_url property"""
        self._setup_storage_mocks(mock_exists, mock_save)
        video = Video.objects.create(**self.video_data)
        assert video.video_url != ""
        assert "test_video" in video.video_url

    def test_video_url_property_no_file(self, mock_exists: Any, mock_save: Any) -> None:
        """Test video_url property when no file"""
        self._setup_storage_mocks(mock_exists, mock_save)
        video = Video()
        assert video.video_url == ""

    def test_autoplay_muted_validation(self, mock_exists: Any, mock_save: Any) -> None:
        """Test that autoplay videos must be muted"""
        self._setup_storage_mocks(mock_exists, mock_save)
        invalid_data = self.video_data.copy()
        invalid_data["autoplay"] = True
        invalid_data["muted"] = False
        invalid_data["video"] = SimpleUploadedFile(
            "test_video2.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        video = Video(**invalid_data)
        with self.assertRaises(ValidationError) as cm:
            video.full_clean()

        assert "Autoplay videos must be muted" in str(cm.exception)

    def test_video_file_extension_validation(
        self,
        mock_exists: Any,
        mock_save: Any,
    ) -> None:
        """Test video file extension validation"""
        self._setup_storage_mocks(mock_exists, mock_save)
        from coalition.content.validators import validate_video_file_extension

        # Test invalid extension
        invalid_file = SimpleUploadedFile(
            "test_video.avi",
            b"file_content",
            content_type="video/avi",
        )

        with self.assertRaises(ValidationError) as cm:
            validate_video_file_extension(invalid_file)

        assert "Unsupported file extension .avi" in str(cm.exception)

        # Test valid extensions
        valid_extensions = [".mov", ".mp4", ".webm"]
        for ext in valid_extensions:
            valid_file = SimpleUploadedFile(
                f"test_video{ext}",
                b"file_content",
                content_type=f"video/{ext[1:]}",
            )
            # Should not raise
            validate_video_file_extension(valid_file)

    def test_html_sanitization_on_save(self, mock_exists: Any, mock_save: Any) -> None:
        """Test that HTML is sanitized on save"""
        self._setup_storage_mocks(mock_exists, mock_save)
        data = self.video_data.copy()
        data["title"] = "<script>alert('xss')</script>Test Video"
        data["alt_text"] = "<b>Bold</b> alt text"
        data["description"] = "<p>Test <script>alert('xss')</script> description</p>"
        data["author"] = "<em>Test</em> Author"
        data["license"] = "CC <script>alert('xss')</script> BY"
        data["video"] = SimpleUploadedFile(
            "test_video3.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        video = Video.objects.create(**data)

        # Title, alt_text, author, license should be plain text (HTML entities escaped)
        # The HTMLSanitizer.sanitize_plain_text method escapes HTML tags
        assert video.title == "&lt;script&gt;alert('xss')&lt;/script&gt;Test Video"
        assert video.alt_text == "&lt;b&gt;Bold&lt;/b&gt; alt text"
        assert video.author == "&lt;em&gt;Test&lt;/em&gt; Author"
        assert video.license == "CC &lt;script&gt;alert('xss')&lt;/script&gt; BY"

        # Description can have some HTML but not scripts
        assert "<script>" not in video.description
        assert "<p>" in video.description  # Safe tags are kept

    def test_video_types(self, mock_exists: Any, mock_save: Any) -> None:
        """Test all valid video types"""
        self._setup_storage_mocks(mock_exists, mock_save)
        valid_types = ["general", "hero", "content", "campaign"]

        for video_type in valid_types:
            data = self.video_data.copy()
            data["video_type"] = video_type
            data["title"] = f"Test {video_type} Video"
            data["video"] = SimpleUploadedFile(
                f"test_{video_type}.mp4",
                b"file_content",
                content_type="video/mp4",
            )
            video = Video.objects.create(**data)
            assert video.video_type == video_type

    def test_default_values(self, mock_exists: Any, mock_save: Any) -> None:
        """Test that default values are set correctly"""
        self._setup_storage_mocks(mock_exists, mock_save)
        minimal_data = {
            "video": SimpleUploadedFile(
                "minimal.mp4",
                b"file_content",
                content_type="video/mp4",
            ),
            "title": "Minimal Video",
            "alt_text": "Minimal alt text",
        }
        video = Video.objects.create(**minimal_data)

        assert video.description == ""
        assert video.author == ""
        assert video.license == ""
        assert video.source_url == ""
        assert video.video_type == "general"
        assert video.autoplay is True
        assert video.loop is True
        assert video.muted is True
        assert video.show_controls is False
        assert video.uploaded_by is None
