from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from coalition.core.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class Theme(models.Model):
    """
    Model for managing site themes and branding.
    Allows organizations to customize colors, typography, and brand assets.
    """

    # Theme identification
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Name for this theme (e.g., 'Default', 'Land and Bay Stewards')",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of this theme",
    )

    # Color validators
    hex_color_validator = RegexValidator(
        regex=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
        message="Color must be a valid hex code (e.g., #FF0000 or #F00)",
    )

    # Primary brand colors
    primary_color = models.CharField(
        max_length=7,
        default="#2563eb",
        validators=[hex_color_validator],
        help_text="Primary brand color (hex format, e.g., #2563eb)",
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#64748b",
        validators=[hex_color_validator],
        help_text="Secondary brand color (hex format)",
    )
    accent_color = models.CharField(
        max_length=7,
        default="#059669",
        validators=[hex_color_validator],
        help_text="Accent color for highlights and calls-to-action (hex format)",
    )

    # Background colors
    background_color = models.CharField(
        max_length=7,
        default="#ffffff",
        validators=[hex_color_validator],
        help_text="Main background color (hex format)",
    )
    section_background_color = models.CharField(
        max_length=7,
        default="#f9fafb",
        validators=[hex_color_validator],
        help_text="Alternate section background color (hex format)",
    )
    card_background_color = models.CharField(
        max_length=7,
        default="#ffffff",
        validators=[hex_color_validator],
        help_text="Card/content block background color (hex format)",
    )

    # Text colors
    heading_color = models.CharField(
        max_length=7,
        default="#111827",
        validators=[hex_color_validator],
        help_text="Color for headings and titles (hex format)",
    )
    body_text_color = models.CharField(
        max_length=7,
        default="#374151",
        validators=[hex_color_validator],
        help_text="Color for body text (hex format)",
    )
    muted_text_color = models.CharField(
        max_length=7,
        default="#6b7280",
        validators=[hex_color_validator],
        help_text="Color for muted/secondary text (hex format)",
    )
    link_color = models.CharField(
        max_length=7,
        default="#2563eb",
        validators=[hex_color_validator],
        help_text="Color for links (hex format)",
    )
    link_hover_color = models.CharField(
        max_length=7,
        default="#1d4ed8",
        validators=[hex_color_validator],
        help_text="Color for links on hover (hex format)",
    )

    # Typography settings
    heading_font_family = models.CharField(
        max_length=200,
        default=(
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "
            '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
        ),
        help_text="Font family for headings (CSS font-family value)",
    )
    body_font_family = models.CharField(
        max_length=200,
        default=(
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "
            '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
        ),
        help_text="Font family for body text (CSS font-family value)",
    )
    google_fonts = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "List of Google Font family names to load "
            "(e.g., ['Merriweather', 'Barlow'])"
        ),
    )

    # Font sizes (in rem units)
    font_size_base = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.00,
        help_text="Base font size in rem units (e.g., 1.00 for 16px)",
    )
    font_size_small = models.DecimalField(
        max_digits=4,
        decimal_places=3,
        default=0.875,
        help_text="Small font size in rem units",
    )
    font_size_large = models.DecimalField(
        max_digits=4,
        decimal_places=3,
        default=1.125,
        help_text="Large font size in rem units",
    )

    # Brand assets
    logo = models.ImageField(
        upload_to="logos/",
        blank=True,
        null=True,
        help_text="Organization logo image",
    )
    logo_alt_text = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Alt text for logo (accessibility)",
    )
    favicon = models.ImageField(
        upload_to="favicons/",
        blank=True,
        null=True,
        help_text="Favicon image",
    )

    # Custom CSS
    custom_css = models.TextField(
        blank=True,
        null=True,
        help_text="Additional custom CSS for advanced styling (optional)",
    )

    # Status and meta
    is_active = models.BooleanField(
        default=False,
        help_text="Whether this theme is currently active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "theme"
        verbose_name = "Theme"
        verbose_name_plural = "Themes"
        ordering = ["-is_active", "-updated_at"]

    def __str__(self) -> str:
        status = " (Active)" if self.is_active else ""
        return f"{self.name}{status}"

    @property
    def logo_url(self) -> str:
        """Return the URL of the uploaded logo, or empty string if no logo."""
        if self.logo and hasattr(self.logo, "url"):
            return self.logo.url
        return ""

    @property
    def favicon_url(self) -> str:
        """Return the URL of the uploaded favicon, or empty string if no favicon."""
        if self.favicon and hasattr(self.favicon, "url"):
            return self.favicon.url
        return ""

    def clean(self) -> None:
        """Ensure only one active theme exists"""
        if self.is_active:
            # Check if there's already an active theme that's not this one
            existing_active = Theme.objects.filter(is_active=True).exclude(pk=self.pk)
            if existing_active.exists():
                raise ValidationError(
                    "Only one theme can be active at a time. "
                    "Please deactivate the current active theme first.",
                )

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize custom CSS and validate before saving"""
        if self.custom_css:
            # Basic sanitization - remove script tags and dangerous content
            self.custom_css = HTMLSanitizer.sanitize_plain_text(self.custom_css)

        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_active(cls) -> "Theme | None":
        """Get the currently active theme"""
        try:
            return cls.objects.get(is_active=True)
        except cls.DoesNotExist:
            return None
        except cls.MultipleObjectsReturned:
            # If somehow multiple active exist, return the most recent
            return cls.objects.filter(is_active=True).order_by("-updated_at").first()

    def generate_css_variables(self) -> str:
        """Generate CSS custom properties for this theme"""
        return f"""
        :root {{
            /* Brand Colors */
            --theme-primary: {self.primary_color};
            --theme-secondary: {self.secondary_color};
            --theme-accent: {self.accent_color};
            
            /* Background Colors */
            --theme-bg: {self.background_color};
            --theme-bg-section: {self.section_background_color};
            --theme-bg-card: {self.card_background_color};
            
            /* Text Colors */
            --theme-text-heading: {self.heading_color};
            --theme-text-body: {self.body_text_color};
            --theme-text-muted: {self.muted_text_color};
            --theme-text-link: {self.link_color};
            --theme-text-link-hover: {self.link_hover_color};
            
            /* Typography */
            --theme-font-heading: {self.heading_font_family};
            --theme-font-body: {self.body_font_family};
            --theme-font-size-base: {self.font_size_base}rem;
            --theme-font-size-small: {self.font_size_small}rem;
            --theme-font-size-large: {self.font_size_large}rem;
        }}
        """.strip()


class HomePage(models.Model):
    """
    Model for managing homepage content.
    Only one instance should exist - the active homepage configuration.
    """

    # Theme relationship
    theme = models.ForeignKey(
        Theme,
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
    hero_background_image = models.ImageField(
        upload_to="backgrounds/",
        blank=True,
        null=True,
        help_text="Hero background image (optional)",
    )

    # Main content sections
    about_section_title = models.CharField(
        max_length=200,
        default="About Our Mission",
        help_text="Title for the about/mission section",
    )
    about_section_content = models.TextField(
        help_text="Main content describing the organization's mission and goals",
    )

    # Call to action
    cta_title = models.CharField(
        max_length=200,
        default="Get Involved",
        help_text="Title for the call-to-action section",
    )
    cta_content = models.TextField(
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

    # Contact information
    contact_email = models.EmailField(help_text="Primary contact email address")
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number (optional)",
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "homepage"
        verbose_name = "Homepage Configuration"
        verbose_name_plural = "Homepage Configurations"

    def __str__(self) -> str:
        return f"Homepage: {self.organization_name}"

    @property
    def hero_background_image_url(self) -> str:
        """Return the URL of the hero background image, or empty string if no image."""
        if self.hero_background_image and hasattr(self.hero_background_image, "url"):
            return self.hero_background_image.url
        return ""

    def clean(self) -> None:
        """Ensure only one active homepage configuration exists"""
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

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Sanitize HTML fields before saving."""
        # Sanitize HTML content fields
        if self.about_section_content:
            self.about_section_content = HTMLSanitizer.sanitize(
                self.about_section_content,
            )

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
        return self.theme or Theme.get_active()


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
        HomePage,
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
