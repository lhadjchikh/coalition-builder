"""Admin configuration for content models."""

from django.contrib import admin

from .models import ContentBlock, HomePage, Theme


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
            "Colors",
            {
                "fields": (
                    "primary_color",
                    "secondary_color",
                    "accent_color",
                    "background_color",
                    "text_color",
                ),
            },
        ),
        ("Typography", {"fields": ("google_fonts",)}),
        ("Custom Styling", {"fields": ("custom_css",), "classes": ("collapse",)}),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(HomePage)
class HomePageAdmin(admin.ModelAdmin):
    """Admin interface for Homepage model."""

    list_display = (
        "organization_name",
        "theme",
        "is_active",
        "created_at",
        "updated_at",
    )
    list_filter = ("theme", "is_active", "created_at")
    search_fields = ("organization_name", "tagline", "hero_title")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("organization_name", "tagline", "theme", "is_active")}),
        (
            "Hero Section",
            {"fields": ("hero_title", "hero_subtitle", "hero_background_image")},
        ),
        (
            "About Section",
            {"fields": ("about_section_title", "about_section_content")},
        ),
        (
            "Contact",
            {"fields": ("contact_email", "contact_phone")},
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    """Admin interface for ContentBlock model."""

    list_display = (
        "title",
        "block_type",
        "homepage",
        "order",
        "is_visible",
        "created_at",
    )
    list_filter = ("block_type", "is_visible", "homepage", "created_at")
    search_fields = ("title", "content")
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("order", "is_visible")

    fieldsets = (
        (None, {"fields": ("title", "block_type", "homepage", "order", "is_visible")}),
        ("Content", {"fields": ("content",)}),
        (
            "Image",
            {
                "fields": (
                    "image_alt_text",
                    "image_title",
                    "image_author",
                    "image_license",
                    "image_source_url",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Styling",
            {
                "fields": ("css_classes", "background_color"),
                "classes": ("collapse",),
            },
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
