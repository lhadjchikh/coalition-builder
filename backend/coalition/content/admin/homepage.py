"""Admin configuration for HomePage model."""

from django.contrib import admin

from coalition.content.models import HomePage


@admin.register(HomePage)
class HomePageAdmin(admin.ModelAdmin):
    """Admin interface for Homepage model."""

    list_display = (
        "organization_name",
        "theme",
        "is_active",
        "has_hero_image",
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

    def has_hero_image(self, obj: HomePage) -> bool:
        """Display whether homepage has a hero image"""
        return bool(obj.hero_background_image)

    has_hero_image.boolean = True
    has_hero_image.short_description = "Has Hero Image"
