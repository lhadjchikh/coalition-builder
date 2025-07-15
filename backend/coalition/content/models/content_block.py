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
        help_text="The homepage this content block belongs to",
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

    image = models.ForeignKey(
        "content.Image",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_block_images",
        help_text="Image for image or text+image blocks",
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

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this content block was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this content block was last updated",
    )

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
        if self.image and self.image.image and hasattr(self.image.image, "url"):
            return self.image.image.url
        return ""

    @property
    def image_alt_text(self) -> str:
        """Return the alt text of the image, or empty string if no image."""
        return self.image.alt_text if self.image else ""

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
