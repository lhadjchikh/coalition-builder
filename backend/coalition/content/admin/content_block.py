"""Admin configuration for ContentBlock model."""

from django.contrib import admin

from coalition.content.models import ContentBlock


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    """Admin interface for ContentBlock model."""

    list_display = (
        "title",
        "block_type",
        "homepage",
        "order",
        "is_visible",
        "has_image",
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
                "fields": ("image",),
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

    def has_image(self, obj: ContentBlock) -> bool:
        """Display whether content block has an image"""
        return bool(obj.image)

    has_image.boolean = True
    has_image.short_description = "Has Image"
