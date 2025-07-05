from django.http import Http404, HttpRequest
from ninja import Router, Schema
from pydantic import Field

from coalition.core.models import Theme

router = Router(tags=["Themes"])


class ThemeOut(Schema):
    """Response schema for Theme model"""

    id: int
    name: str
    description: str | None = None

    # Brand colors
    primary_color: str
    secondary_color: str
    accent_color: str

    # Background colors
    background_color: str
    section_background_color: str
    card_background_color: str

    # Text colors
    heading_color: str
    body_text_color: str
    muted_text_color: str
    link_color: str
    link_hover_color: str

    # Typography
    heading_font_family: str
    body_font_family: str
    google_fonts: list[str]
    font_size_base: float
    font_size_small: float
    font_size_large: float

    # Brand assets
    logo_url: str | None = None
    logo_alt_text: str | None = None
    favicon_url: str | None = None

    # Custom CSS
    custom_css: str | None = None

    # Status
    is_active: bool
    created_at: str
    updated_at: str


class ThemeIn(Schema):
    """Input schema for creating/updating themes"""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None

    # Brand colors (hex validation handled by model)
    primary_color: str = Field(
        default="#2563eb",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    secondary_color: str = Field(
        default="#64748b",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    accent_color: str = Field(
        default="#059669",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )

    # Background colors
    background_color: str = Field(
        default="#ffffff",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    section_background_color: str = Field(
        default="#f9fafb",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    card_background_color: str = Field(
        default="#ffffff",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )

    # Text colors
    heading_color: str = Field(
        default="#111827",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    body_text_color: str = Field(
        default="#374151",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    muted_text_color: str = Field(
        default="#6b7280",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    link_color: str = Field(
        default="#2563eb",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )
    link_hover_color: str = Field(
        default="#1d4ed8",
        pattern=r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
    )

    # Typography
    heading_font_family: str = Field(
        default=(
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "
            '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", '
            "sans-serif"
        ),
        max_length=200,
    )
    body_font_family: str = Field(
        default=(
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "
            '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", '
            "sans-serif"
        ),
        max_length=200,
    )
    google_fonts: list[str] = Field(
        default_factory=list,
        description="List of Google Font family names to load",
    )
    font_size_base: float = Field(default=1.0, ge=0.5, le=2.0)
    font_size_small: float = Field(default=0.875, ge=0.5, le=2.0)
    font_size_large: float = Field(default=1.125, ge=0.5, le=2.0)

    # Brand assets
    logo_url: str | None = None
    logo_alt_text: str | None = Field(None, max_length=200)
    favicon_url: str | None = None

    # Custom CSS
    custom_css: str | None = None

    # Status
    is_active: bool = False


class ThemeCSSOut(Schema):
    """Response schema for theme CSS generation"""

    css_variables: str
    custom_css: str | None = None


@router.get("/", response=list[ThemeOut])
def list_themes(request: HttpRequest) -> list[Theme]:
    """List all themes, ordered by active status then most recent"""
    return list(Theme.objects.all())


@router.get("/active/", response=ThemeOut | None)
def get_active_theme(request: HttpRequest) -> Theme | None:
    """Get the currently active theme"""
    return Theme.get_active()


@router.get("/{theme_id}/", response=ThemeOut)
def get_theme(request: HttpRequest, theme_id: int) -> Theme:
    """Get a specific theme by ID"""
    try:
        return Theme.objects.get(id=theme_id)
    except Theme.DoesNotExist:
        raise Http404("Theme not found") from None


@router.get("/{theme_id}/css/", response=ThemeCSSOut)
def get_theme_css(request: HttpRequest, theme_id: int) -> dict:
    """Get CSS variables and custom CSS for a specific theme"""
    try:
        theme = Theme.objects.get(id=theme_id)
        return {
            "css_variables": theme.generate_css_variables(),
            "custom_css": theme.custom_css,
        }
    except Theme.DoesNotExist:
        raise Http404("Theme not found") from None


@router.get("/active/css/", response=ThemeCSSOut)
def get_active_theme_css(request: HttpRequest) -> dict:
    """Get CSS variables and custom CSS for the active theme"""
    theme = Theme.get_active()
    if not theme:
        # Return default theme values if no active theme
        return {
            "css_variables": "",
            "custom_css": None,
        }

    return {
        "css_variables": theme.generate_css_variables(),
        "custom_css": theme.custom_css,
    }


@router.post("/", response=ThemeOut)
def create_theme(request: HttpRequest, data: ThemeIn) -> Theme:
    """Create a new theme"""
    theme = Theme.objects.create(**data.dict())
    return theme


@router.put("/{theme_id}/", response=ThemeOut)
def update_theme(request: HttpRequest, theme_id: int, data: ThemeIn) -> Theme:
    """Update an existing theme"""
    try:
        theme = Theme.objects.get(id=theme_id)
        for attr, value in data.dict(exclude_unset=True).items():
            setattr(theme, attr, value)
        theme.save()
        return theme
    except Theme.DoesNotExist:
        raise Http404("Theme not found") from None


@router.patch("/{theme_id}/activate/", response=ThemeOut)
def activate_theme(request: HttpRequest, theme_id: int) -> Theme:
    """Activate a specific theme (deactivates all others)"""
    try:
        # Deactivate all themes
        Theme.objects.filter(is_active=True).update(is_active=False)

        # Activate the requested theme
        theme = Theme.objects.get(id=theme_id)
        theme.is_active = True
        theme.save()

        return theme
    except Theme.DoesNotExist:
        raise Http404("Theme not found") from None


@router.delete("/{theme_id}/")
def delete_theme(request: HttpRequest, theme_id: int) -> dict:
    """Delete a theme (cannot delete active theme)"""
    try:
        theme = Theme.objects.get(id=theme_id)

        if theme.is_active:
            return {
                "error": (
                    "Cannot delete the active theme. "
                    "Please activate another theme first."
                ),
            }, 400

        theme.delete()
        return {"message": "Theme deleted successfully"}
    except Theme.DoesNotExist:
        raise Http404("Theme not found") from None
