"""Admin configuration for people displayed on team pages."""

from django.contrib import admin

from coalition.admin_help.admin_links import HelpLinkAdminMixin
from coalition.content.models import Person


@admin.register(Person)
class PersonAdmin(HelpLinkAdminMixin, admin.ModelAdmin):
    """Manage a person's public listing and optional biography page."""

    help_page_slug = "team"
    list_display = (
        "name",
        "title",
        "group",
        "order",
        "is_active",
        "profile_page_enabled",
        "has_headshot",
    )
    list_filter = ("group", "is_active", "profile_page_enabled")
    list_editable = ("order", "is_active")
    search_fields = ("name", "title", "bio", "email")
    readonly_fields = ("slug", "created_at", "updated_at")
    fieldsets = (
        (
            "Person",
            {
                "fields": (
                    "group",
                    "name",
                    "title",
                    "slug",
                    "order",
                    "is_active",
                    "profile_page_enabled",
                ),
            },
        ),
        (
            "Biography & Contact",
            {"fields": ("bio", "email", "linkedin_url")},
        ),
        ("Headshot", {"fields": ("headshot",)}),
        (
            "Metadata",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Has Headshot", boolean=True)
    def has_headshot(self, obj: Person) -> bool:
        """Report whether the person references an image."""
        return obj.headshot_id is not None
