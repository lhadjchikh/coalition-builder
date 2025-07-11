"""
Theme service for generating dynamic CSS and managing theme-related operations.
"""

from typing import TYPE_CHECKING

from django.http import HttpResponse

from coalition.content.models import Theme

if TYPE_CHECKING:
    from coalition.content.models import HomePage


class ThemeService:
    """Service for theme-related operations and CSS generation"""

    @staticmethod
    def get_theme_css_response(theme: Theme | None = None) -> HttpResponse:
        """
        Generate a CSS HttpResponse for a theme.

        Args:
            theme: Theme instance. If None, uses the active theme.

        Returns:
            HttpResponse with CSS content type
        """
        if theme is None:
            theme = Theme.get_active()

        css_content = "" if theme is None else ThemeService.generate_theme_css(theme)

        response = HttpResponse(css_content, content_type="text/css")

        # Add cache headers for production performance
        if theme:
            # Cache for 1 hour, but allow revalidation
            response["Cache-Control"] = "max-age=3600, must-revalidate"
            # Use theme's updated_at timestamp for ETag
            response["ETag"] = f'"{theme.id}-{int(theme.updated_at.timestamp())}"'
        else:
            # Don't cache if no theme
            response["Cache-Control"] = "no-cache"

        return response

    @staticmethod
    def generate_theme_css(theme: Theme) -> str:
        """
        Generate complete CSS for a theme including variables and custom CSS.

        Args:
            theme: Theme instance

        Returns:
            Complete CSS string
        """
        css_parts = []

        # Add CSS variables
        css_variables = theme.generate_css_variables()
        if css_variables:
            css_parts.append(css_variables)

        # Add utility classes that use the variables
        utility_css = ThemeService.generate_utility_classes()
        if utility_css:
            css_parts.append(utility_css)

        # Add custom CSS if present
        if theme.custom_css:
            css_parts.append(theme.custom_css)

        return "\n\n".join(css_parts)

    @staticmethod
    def generate_utility_classes() -> str:
        """
        Generate utility CSS classes that use theme variables.
        These provide easy-to-use classes for common theming needs.
        """
        return """
/* Theme Utility Classes */

/* Background utilities */
.bg-theme-primary { background-color: var(--theme-primary); }
.bg-theme-secondary { background-color: var(--theme-secondary); }
.bg-theme-accent { background-color: var(--theme-accent); }
.bg-theme-bg { background-color: var(--theme-bg); }
.bg-theme-section { background-color: var(--theme-bg-section); }
.bg-theme-card { background-color: var(--theme-bg-card); }

/* Text color utilities */
.text-theme-primary { color: var(--theme-primary); }
.text-theme-secondary { color: var(--theme-secondary); }
.text-theme-accent { color: var(--theme-accent); }
.text-theme-heading { color: var(--theme-text-heading); }
.text-theme-body { color: var(--theme-text-body); }
.text-theme-muted { color: var(--theme-text-muted); }
.text-theme-link { color: var(--theme-text-link); }

/* Border utilities */
.border-theme-primary { border-color: var(--theme-primary); }
.border-theme-secondary { border-color: var(--theme-secondary); }
.border-theme-accent { border-color: var(--theme-accent); }

/* Font family utilities */
.font-theme-heading { font-family: var(--theme-font-heading); }
.font-theme-body { font-family: var(--theme-font-body); }

/* Font size utilities */
.text-theme-base { font-size: var(--theme-font-size-base); }
.text-theme-small { font-size: var(--theme-font-size-small); }
.text-theme-large { font-size: var(--theme-font-size-large); }

/* Link styles with hover effects */
.link-theme {
    color: var(--theme-text-link);
    text-decoration: none;
    transition: color 0.2s ease;
}

.link-theme:hover {
    color: var(--theme-text-link-hover);
}

/* Button variants using theme colors */
.btn-theme-primary {
    background-color: var(--theme-primary);
    color: white;
    border: 2px solid var(--theme-primary);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-theme-primary:hover {
    background-color: transparent;
    color: var(--theme-primary);
}

.btn-theme-secondary {
    background-color: var(--theme-secondary);
    color: white;
    border: 2px solid var(--theme-secondary);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-theme-secondary:hover {
    background-color: transparent;
    color: var(--theme-secondary);
}

.btn-theme-accent {
    background-color: var(--theme-accent);
    color: white;
    border: 2px solid var(--theme-accent);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-theme-accent:hover {
    background-color: transparent;
    color: var(--theme-accent);
}

/* Card styling with theme colors */
.card-theme {
    background-color: var(--theme-bg-card);
    border: 1px solid var(--theme-secondary);
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Section styling */
.section-theme {
    background-color: var(--theme-bg-section);
    padding: 3rem 0;
}

.section-theme-alt {
    background-color: var(--theme-bg);
    padding: 3rem 0;
}
        """.strip()

    @staticmethod
    def get_theme_for_homepage(homepage: "HomePage") -> Theme | None:
        """
        Get the effective theme for a homepage.

        Args:
            homepage: HomePage instance

        Returns:
            Theme instance or None
        """
        # Use homepage-specific theme if set, otherwise fall back to active theme
        return homepage.theme or Theme.get_active()

    @staticmethod
    def apply_theme_to_component_props(theme: Theme | None) -> dict:
        """
        Generate props dictionary with theme values for React components.

        Args:
            theme: Theme instance or None

        Returns:
            Dictionary with theme properties
        """
        if not theme:
            return {}

        return {
            "theme": {
                "colors": {
                    "primary": theme.primary_color,
                    "secondary": theme.secondary_color,
                    "accent": theme.accent_color,
                    "background": theme.background_color,
                    "sectionBackground": theme.section_background_color,
                    "cardBackground": theme.card_background_color,
                    "heading": theme.heading_color,
                    "bodyText": theme.body_text_color,
                    "mutedText": theme.muted_text_color,
                    "link": theme.link_color,
                    "linkHover": theme.link_hover_color,
                },
                "typography": {
                    "headingFont": theme.heading_font_family,
                    "bodyFont": theme.body_font_family,
                    "sizeBase": f"{theme.font_size_base}rem",
                    "sizeSmall": f"{theme.font_size_small}rem",
                    "sizeLarge": f"{theme.font_size_large}rem",
                },
                "assets": {
                    "logoUrl": theme.logo_url,
                    "logoAlt": theme.logo_alt_text,
                    "faviconUrl": theme.favicon_url,
                },
            },
        }
