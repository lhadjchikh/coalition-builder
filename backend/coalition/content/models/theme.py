"""Theme model for managing site themes and branding."""

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from coalition.content.html_sanitizer import HTMLSanitizer

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
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this theme was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this theme was last updated",
    )

    class Meta:
        db_table = "theme"
        verbose_name = "Theme"
        verbose_name_plural = "Themes"
        ordering = ["-is_active", "-updated_at"]

    def __str__(self) -> str:
        status = " (Active)" if self.is_active else ""
        return f"{self.name}{status}"

    @property
    def logo_url(self) -> str | None:
        """Return the URL of the uploaded logo, or None if no logo."""
        if self.logo and hasattr(self.logo, "url"):
            return self.logo.url
        return None

    @property
    def favicon_url(self) -> str | None:
        """Return the URL of the uploaded favicon, or None if no favicon."""
        if self.favicon and hasattr(self.favicon, "url"):
            return self.favicon.url
        return None

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
        css_parts = []

        # Add Google Fonts import if specified
        if (
            self.google_fonts
            and isinstance(self.google_fonts, list)
            and len(self.google_fonts) > 0
        ):
            # Filter out empty strings and format font names
            font_families = []
            for font in self.google_fonts:
                if font and font.strip():
                    # Replace spaces with + and add default weights
                    font_name = font.strip().replace(" ", "+")
                    font_families.append(f"{font_name}:400,500,600,700")

            if font_families:
                fonts_url = f"https://fonts.googleapis.com/css2?family={'&family='.join(font_families)}&display=swap"
                css_parts.append(f'@import url("{fonts_url}");')

        # Add CSS variables
        css_parts.append(
            f"""
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
        """.strip(),
        )

        return "\n\n".join(css_parts)
