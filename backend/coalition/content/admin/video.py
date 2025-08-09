"""Admin configuration for Video model."""

from django.contrib import admin
from django.forms import ModelForm
from django.http import HttpRequest
from django.utils.html import format_html

from coalition.content.models import Video


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """Admin interface for Video model."""

    list_display = (
        "title",
        "video_type",
        "display_video_file",
        "autoplay",
        "loop",
        "muted",
        "show_controls",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("video_type", "autoplay", "loop", "muted", "created_at")
    search_fields = ("title", "alt_text", "description", "author", "license")
    readonly_fields = ("created_at", "updated_at", "display_video_preview")
    raw_id_fields = ("uploaded_by",)

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "video",
                    "display_video_preview",
                    "title",
                    "alt_text",
                    "description",
                    "video_type",
                ),
            },
        ),
        (
            "Video Settings",
            {
                "fields": (
                    "autoplay",
                    "loop",
                    "muted",
                    "show_controls",
                ),
                "description": (
                    "Note: Autoplay videos must be muted due to browser policies."
                ),
            },
        ),
        (
            "Attribution",
            {
                "fields": (
                    "author",
                    "license",
                    "source_url",
                ),
                "classes": ("collapse",),
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

    @admin.display(description="Video File")
    def display_video_file(self, obj: Video) -> str:
        """Display video file name or 'No file'."""
        if obj.video:
            return obj.video.name.split("/")[-1]
        return "-"

    @admin.display(description="Preview")
    def display_video_preview(self, obj: Video) -> str:
        """Display video preview if available."""
        if obj.video and hasattr(obj.video, "url"):
            return format_html(
                '<video width="320" height="240" controls>'
                '<source src="{}" type="video/mp4">'
                "Your browser does not support the video tag."
                "</video>",
                obj.video.url,
            )
        return "No video uploaded"

    def save_model(
        self,
        request: HttpRequest,
        obj: Video,
        form: ModelForm,
        change: bool,
    ) -> None:
        """Set uploaded_by to current user if not set."""
        if not obj.uploaded_by:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
