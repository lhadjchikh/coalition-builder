"""HomePage model for managing homepage content."""

import re
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from tinymce.models import HTMLField

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any

    from .theme import Theme


class HomePage(models.Model):
    """
    Model for managing homepage content.
    Only one instance should exist - the active homepage configuration.
    """

    # Theme relationship
    theme = models.ForeignKey(
        "content.Theme",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=(
            "Theme to use for this homepage (optional, falls back to active theme)"
        ),
    )

    # Basic organization info
    organization_name = models.CharField(
        max_length=200,
        help_text="Name of the organization",
    )
    tagline = models.CharField(
        max_length=500,
        help_text="Brief tagline or slogan for the organization",
    )

    # Hero section
    hero_title = models.CharField(
        max_length=300,
        help_text="Main headline displayed prominently on the homepage",
    )
    hero_subtitle = models.TextField(
        blank=True,
        help_text="Optional subtitle or description under the hero title",
    )
    hero_background_image = models.ForeignKey(
        "content.Image",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homepage_hero_images",
        help_text="Hero background image (optional)",
    )
    hero_background_video = models.ForeignKey(
        "content.Video",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homepage_hero_videos",
        help_text="Hero background video (optional, takes precedence over image)",
    )

    # Hero overlay configuration
    hero_overlay_enabled = models.BooleanField(
        default=True,
        help_text="Whether to show overlay on hero image/video for text readability",
    )
    hero_overlay_color = models.CharField(
        max_length=7,
        default="#000000",
        help_text="Hex color code for the overlay (e.g., #000000 for black)",
    )
    hero_overlay_opacity = models.FloatField(
        default=0.4,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Overlay opacity (0.0 = transparent, 1.0 = opaque)",
    )

    # Call to action
    cta_title = models.CharField(
        max_length=200,
        default="Get Involved",
        help_text="Title for the call-to-action section",
    )
    cta_content = HTMLField(
        blank=True,
        help_text="Description for how people can get involved",
    )
    cta_button_text = models.CharField(
        max_length=100,
        default="Learn More",
        help_text="Text for the call-to-action button",
    )
    cta_button_url = models.URLField(
        blank=True,
        help_text="URL for the call-to-action button",
    )

    # Social media
    facebook_url = models.URLField(blank=True, help_text="Facebook page URL")
    twitter_url = models.URLField(blank=True, help_text="Twitter/X profile URL")
    instagram_url = models.URLField(blank=True, help_text="Instagram profile URL")
    linkedin_url = models.URLField(blank=True, help_text="LinkedIn page URL")

    # Campaign section customization
    campaigns_section_title = models.CharField(
        max_length=200,
        default="Policy Campaigns",
        help_text="Title for the campaigns section",
    )
    campaigns_section_subtitle = models.TextField(
        blank=True,
        help_text="Optional subtitle for the campaigns section",
    )
    show_campaigns_section = models.BooleanField(
        default=True,
        help_text="Whether to display the campaigns section on the homepage",
    )

    # Meta information
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this homepage configuration is active",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this homepage configuration was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this homepage configuration was last updated",
    )

    class Meta:
        db_table = "homepage"
        verbose_name = "Homepage Configuration"
        verbose_name_plural = "Homepage Configurations"

    def __str__(self) -> str:
        return f"Homepage: {self.organization_name}"

    @property
    def hero_background_image_url(self) -> str:
        """Return the URL of the hero background image, or empty string if no image."""
        if (
            self.hero_background_image
            and self.hero_background_image.image
            and hasattr(self.hero_background_image.image, "url")
        ):
            return self.hero_background_image.image.url
        return ""

    @property
    def hero_background_video_url(self) -> str:
        """Return the URL of the hero background video, or empty string if no video."""
        if (
            self.hero_background_video
            and self.hero_background_video.video
            and hasattr(self.hero_background_video.video, "url")
        ):
            return self.hero_background_video.video.url
        return ""

    def clean(self) -> None:
        """Validate homepage configuration"""
        if self.is_active:
            # Check if there's already an active homepage that's not this one
            existing_active = HomePage.objects.filter(is_active=True).exclude(
                pk=self.pk,
            )
            if existing_active.exists():
                raise ValidationError(
                    "Only one homepage configuration can be active at a time. "
                    "Please deactivate the current active configuration first.",
                )

        # Validate hex color format
        if not re.match(r"^#[0-9A-Fa-f]{6}$", self.hero_overlay_color):
            raise ValidationError(
                "Hero overlay color must be a valid hex color code (e.g., #000000)",
            )

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize HTML fields before saving."""
        # Sanitize HTML content fields
        if self.cta_content:
            self.cta_content = HTMLSanitizer.sanitize(self.cta_content)

        # Sanitize plain text fields (these shouldn't have HTML)
        if self.hero_subtitle:
            self.hero_subtitle = HTMLSanitizer.sanitize_plain_text(self.hero_subtitle)

        if self.campaigns_section_subtitle:
            self.campaigns_section_subtitle = HTMLSanitizer.sanitize_plain_text(
                self.campaigns_section_subtitle,
            )

        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_active(cls) -> "HomePage | None":
        """Get the currently active homepage configuration"""
        try:
            return cls.objects.get(is_active=True)
        except cls.DoesNotExist:
            return None
        except cls.MultipleObjectsReturned:
            # If somehow multiple active exist, return the most recent
            return cls.objects.filter(is_active=True).order_by("-updated_at").first()

    def get_theme(self) -> "Theme | None":
        """Get the effective theme for this homepage"""
        # Use homepage-specific theme if set, otherwise fall back to active theme
        from .theme import Theme

        return self.theme or Theme.get_active()
