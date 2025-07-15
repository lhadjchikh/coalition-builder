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
            "Call to Action",
            {
                "fields": (
                    "cta_title",
                    "cta_content",
                    "cta_button_text",
                    "cta_button_url",
                ),
            },
        ),
        (
            "Campaigns Section",
            {
                "fields": (
                    "campaigns_section_title",
                    "campaigns_section_subtitle",
                    "show_campaigns_section",
                ),
            },
        ),
        (
            "Contact",
            {"fields": ("contact_email", "contact_phone")},
        ),
        (
            "Social Media",
            {
                "fields": (
                    "facebook_url",
                    "twitter_url",
                    "instagram_url",
                    "linkedin_url",
                ),
                "classes": ("collapse",),
            },
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
                    "image",
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
