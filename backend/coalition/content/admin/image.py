"""Admin configuration for Image model."""

from django.contrib import admin
from django.forms import ModelForm
from django.http import HttpRequest

from coalition.content.models import Image


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    """Admin interface for Image model."""

    list_display = (
        "title",
        "image_type",
        "has_caption",
        "author",
        "license",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("image_type", "license", "created_at", "uploaded_by")
    search_fields = ("title", "alt_text", "description", "author")
    readonly_fields = ("created_at", "updated_at", "uploaded_by")

    fieldsets = (
        (
            "Image Information",
            {
                "fields": (
                    "image",
                    "title",
                    "alt_text",
                    "description",
                    "image_type",
                ),
            },
        ),
        (
            "Attribution & Licensing",
            {
                "fields": (
                    "author",
                    "license",
                    "source_url",
                ),
            },
        ),
        (
            "Caption",
            {
                "fields": (
                    "caption",
                    "caption_display",
                ),
                "description": (
                    "Custom caption/credit text for the image. When provided, "
                    "this will be used instead of assembling credit from the "
                    "attribution fields above. HTML is allowed, including links."
                ),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("uploaded_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def has_caption(self, obj: Image) -> bool:
        """Check if the image has a custom caption."""
        return bool(obj.caption)

    has_caption.boolean = True
    has_caption.short_description = "Has Caption"

    def save_model(
        self,
        request: HttpRequest,
        obj: Image,
        form: ModelForm,
        change: bool,
    ) -> None:
        """Set the uploaded_by field to the current user."""
        if not change:  # Only set on creation
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
