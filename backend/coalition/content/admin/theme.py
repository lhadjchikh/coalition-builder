"""Admin configuration for Theme model."""

from django.contrib import admin

from coalition.content.models import Theme


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    """Admin interface for Theme model."""

    list_display = ("name", "description", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("name", "description", "is_active")}),
        (
            "Primary Colors",
            {
                "fields": (
                    "primary_color",
                    "secondary_color",
                    "accent_color",
                ),
            },
        ),
        (
            "Background Colors",
            {
                "fields": (
                    "background_color",
                    "section_background_color",
                    "card_background_color",
                ),
            },
        ),
        (
            "Text Colors",
            {
                "fields": (
                    "heading_color",
                    "body_text_color",
                    "muted_text_color",
                    "link_color",
                    "link_hover_color",
                ),
            },
        ),
        (
            "Typography",
            {
                "fields": (
                    "heading_font_family",
                    "body_font_family",
                    "google_fonts",
                    "font_size_base",
                    "font_size_small",
                    "font_size_large",
                ),
            },
        ),
        (
            "Brand Assets",
            {
                "fields": (
                    "logo",
                    "logo_alt_text",
                    "favicon",
                ),
            },
        ),
        ("Custom Styling", {"fields": ("custom_css",), "classes": ("collapse",)}),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
