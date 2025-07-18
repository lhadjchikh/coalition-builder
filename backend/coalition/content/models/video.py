"""Video model for managing videos with metadata and attribution."""

from typing import TYPE_CHECKING, Any

from django.core.exceptions import ValidationError
from django.db import models

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    pass


def validate_video_file_extension(value: Any) -> None:
    """Validate that the uploaded file is a supported video format."""
    import os

    valid_extensions = [".mov", ".mp4", ".webm"]
    ext = os.path.splitext(value.name)[1].lower()

    if ext not in valid_extensions:
        raise ValidationError(
            f"Unsupported file extension {ext}. "
            f'Allowed extensions: {", ".join(valid_extensions)}',
        )


class Video(models.Model):
    """
    Model for storing videos with metadata and attribution information.

    This model handles video content across the application,
    providing proper attribution, licensing, and accessibility information.
    """

    # Video file and basic info
    video = models.FileField(
        upload_to="videos/",
        validators=[validate_video_file_extension],
        help_text="The video file (.mov, .mp4, .webm)",
    )

    title = models.CharField(
        max_length=200,
        help_text="Title or name of the video",
    )

    alt_text = models.CharField(
        max_length=200,
        help_text="Alt text for the video (accessibility)",
    )

    description = models.TextField(
        blank=True,
        help_text="Optional description of the video",
    )

    # Attribution and licensing
    author = models.CharField(
        max_length=200,
        blank=True,
        help_text="Author/creator of the video",
    )

    license = models.CharField(
        max_length=100,
        blank=True,
        help_text="License of the video (e.g., 'CC BY 2.0', 'All rights reserved')",
    )

    source_url = models.URLField(
        blank=True,
        help_text="Source URL where the video was obtained",
    )

    # Video type categorization
    VIDEO_TYPES = [
        ("general", "General Video"),
        ("hero", "Hero/Background Video"),
        ("content", "Content Video"),
        ("campaign", "Campaign Video"),
    ]

    video_type = models.CharField(
        max_length=20,
        choices=VIDEO_TYPES,
        default="general",
        help_text="Type/category of the video",
    )

    # Video-specific settings
    autoplay = models.BooleanField(
        default=True,
        help_text="Whether the video should autoplay (for hero videos)",
    )

    loop = models.BooleanField(
        default=True,
        help_text="Whether the video should loop continuously",
    )

    muted = models.BooleanField(
        default=True,
        help_text="Whether video should be muted by default (required for autoplay)",
    )

    show_controls = models.BooleanField(
        default=False,
        help_text="Whether to show video playback controls",
    )

    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this video was uploaded",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this video was last updated",
    )

    uploaded_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_videos",
        help_text="User who uploaded this video",
    )

    class Meta:
        db_table = "video"
        verbose_name = "Video"
        verbose_name_plural = "Videos"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    @property
    def video_url(self) -> str:
        """Return the URL of the uploaded video, or empty string if no video."""
        if self.video and hasattr(self.video, "url"):
            return self.video.url
        return ""

    def clean(self) -> None:
        """Validate that autoplay videos are muted."""
        if self.autoplay and not self.muted:
            raise ValidationError(
                "Autoplay videos must be muted due to browser policies.",
            )

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize text fields before saving."""
        # Sanitize title and alt_text (should be plain text)
        if self.title:
            self.title = HTMLSanitizer.sanitize_plain_text(self.title)

        if self.alt_text:
            self.alt_text = HTMLSanitizer.sanitize_plain_text(self.alt_text)

        if self.author:
            self.author = HTMLSanitizer.sanitize_plain_text(self.author)

        if self.license:
            self.license = HTMLSanitizer.sanitize_plain_text(self.license)

        # Sanitize description (can have some HTML)
        if self.description:
            self.description = HTMLSanitizer.sanitize(self.description)

        self.full_clean()
        super().save(*args, **kwargs)
