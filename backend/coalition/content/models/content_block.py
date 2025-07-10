"""ContentBlock model for flexible homepage content sections."""

from typing import TYPE_CHECKING

from django.db import models

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class ContentBlock(models.Model):
    """
    Flexible content blocks that can be added to the homepage.
    Allows for more dynamic content sections beyond the fixed structure.
    """

    BLOCK_TYPES = [
        ("text", "Text Block"),
        ("image", "Image Block"),
        ("text_image", "Text + Image Block"),
        ("quote", "Quote Block"),
        ("stats", "Statistics Block"),
        ("custom_html", "Custom HTML Block"),
    ]

    homepage = models.ForeignKey(
        "content.HomePage",
        on_delete=models.CASCADE,
        related_name="content_blocks",
    )

    title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional title for this content block",
    )

    block_type = models.CharField(
        max_length=20,
        choices=BLOCK_TYPES,
        default="text",
        help_text="Type of content block",
    )

    content = models.TextField(
        help_text="Main content for this block (text, HTML, etc.)",
    )

    image = models.ImageField(
        upload_to="content_blocks/",
        blank=True,
        null=True,
        help_text="Image for image or text+image blocks",
    )

    image_alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Alt text for the image (accessibility)",
    )
    image_title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Title of the image for attribution",
    )
    image_author = models.CharField(
        max_length=200,
        blank=True,
        help_text="Author/photographer of the image",
    )
    image_license = models.CharField(
        max_length=100,
        blank=True,
        help_text="License of the image (e.g., 'CC BY 2.0', 'All rights reserved')",
    )
    image_source_url = models.URLField(
        blank=True,
        help_text="Source URL where the image was obtained",
    )

    # Layout options
    css_classes = models.CharField(
        max_length=200,
        blank=True,
        help_text="Additional CSS classes for styling (optional)",
    )

    background_color = models.CharField(
        max_length=7,
        blank=True,
        help_text="Background color in hex format (e.g., #ffffff)",
    )

    # Ordering and visibility
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which this block appears (lower numbers first)",
    )

    is_visible = models.BooleanField(
        default=True,
        help_text="Whether this block is visible on the homepage",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_block"
        ordering = ["order", "created_at"]
        verbose_name = "Content Block"
        verbose_name_plural = "Content Blocks"

    def __str__(self) -> str:
        return f"Block: {self.title or self.block_type} (Order: {self.order})"

    @property
    def image_url(self) -> str:
        """Return the URL of the uploaded image, or empty string if no image."""
        if self.image and hasattr(self.image, "url"):
            return self.image.url
        return ""

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize content based on block type before saving."""
        if self.content:
            if self.block_type == "quote":
                # Quotes should be plain text only
                self.content = HTMLSanitizer.sanitize_plain_text(self.content)
            else:
                # All other block types get HTML sanitization
                self.content = HTMLSanitizer.sanitize(self.content)

        # Sanitize title (should be plain text)
        if self.title:
            self.title = HTMLSanitizer.sanitize_plain_text(self.title)

        super().save(*args, **kwargs)
