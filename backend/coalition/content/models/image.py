"""Image model for managing images with metadata and attribution."""

from typing import TYPE_CHECKING

from django.db import models

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class Image(models.Model):
    """
    Model for storing images with metadata and attribution information.

    This model consolidates all image-related functionality across the application,
    providing proper attribution, licensing, and accessibility information.
    """

    # Image file and basic info
    image = models.ImageField(
        upload_to="images/",
        help_text="The image file",
    )

    title = models.CharField(
        max_length=200,
        help_text="Title or name of the image",
    )

    alt_text = models.CharField(
        max_length=200,
        help_text="Alt text for the image (accessibility)",
    )

    description = models.TextField(
        blank=True,
        help_text="Optional description of the image",
    )

    # Attribution and licensing
    author = models.CharField(
        max_length=200,
        blank=True,
        help_text="Author/photographer of the image",
    )

    license = models.CharField(
        max_length=100,
        blank=True,
        help_text="License of the image (e.g., 'CC BY 2.0', 'All rights reserved')",
    )

    source_url = models.URLField(
        blank=True,
        help_text="Source URL where the image was obtained",
    )

    # Image type categorization
    IMAGE_TYPES = [
        ("general", "General Image"),
        ("hero", "Hero/Background Image"),
        ("content", "Content Image"),
        ("campaign", "Campaign Image"),
    ]

    image_type = models.CharField(
        max_length=20,
        choices=IMAGE_TYPES,
        default="general",
        help_text="Type/category of the image",
    )

    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this image was uploaded",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this image was last updated",
    )

    uploaded_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_images",
        help_text="User who uploaded this image",
    )

    class Meta:
        db_table = "image"
        verbose_name = "Image"
        verbose_name_plural = "Images"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

    @property
    def image_url(self) -> str:
        """Return the URL of the uploaded image, or empty string if no image."""
        if self.image and hasattr(self.image, "url"):
            return self.image.url
        return ""

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

        super().save(*args, **kwargs)
