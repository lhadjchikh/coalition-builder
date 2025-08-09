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
        "has_hero_video",
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
            {
                "fields": (
                    "hero_title",
                    "hero_subtitle",
                    "hero_background_image",
                    "hero_background_video",
                ),
                "description": (
                    "You can set either a background image or video. "
                    "Videos should be uploaded and configured in the Videos "
                    "section first."
                ),
            },
        ),
        (
            "Hero Overlay Settings",
            {
                "fields": (
                    "hero_overlay_enabled",
                    "hero_overlay_color",
                    "hero_overlay_opacity",
                ),
                "classes": ("collapse",),
                "description": (
                    "Configure the overlay that appears on top of the hero "
                    "image/video for better text readability."
                ),
            },
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

    @admin.display(description="Has Hero Image", boolean=True)
    def has_hero_image(self, obj: HomePage) -> bool:
        """Display whether homepage has a hero image"""
        return bool(obj.hero_background_image)

    @admin.display(description="Has Hero Video", boolean=True)
    def has_hero_video(self, obj: HomePage) -> bool:
        """Display whether homepage has a hero video"""
        return bool(obj.hero_background_video)
