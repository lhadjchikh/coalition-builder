"""Admin configuration for ContentBlock model."""

from django.contrib import admin

from coalition.content.models import ContentBlock


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    """Admin interface for ContentBlock model."""

    list_display = (
        "display_title",
        "block_type",
        "page_type",
        "order",
        "is_visible",
        "has_image",
        "created_at",
    )
    list_filter = ("block_type", "page_type", "is_visible", "created_at")
    search_fields = ("title", "content")
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("order", "is_visible")

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "title",
                    "block_type",
                    "page_type",
                    "order",
                    "is_visible",
                    "content",
                    "image",
                ),
            },
        ),
        (
            "Layout & Styling",
            {
                "fields": (
                    "layout_option",
                    "vertical_alignment",
                    "css_classes",
                    "background_color",
                ),
                "description": (
                    "Layout and alignment options only apply to Text + Image blocks"
                ),
            },
        ),
        (
            "Animation",
            {
                "fields": (
                    "animation_type",
                    "animation_delay",
                ),
                "classes": ("collapse",),
                "description": (
                    "Animation effects when the content block enters the viewport"
                ),
            },
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def display_title(self, obj: ContentBlock) -> str:
        """Display title with a more meaningful placeholder for empty titles"""
        if obj.title:
            return obj.title
        return f"(No title - {obj.get_block_type_display()})"

    display_title.short_description = "Title"

    def has_image(self, obj: ContentBlock) -> bool:
        """Display whether content block has an image"""
        return bool(obj.image)

    has_image.boolean = True
    has_image.short_description = "Has Image"
