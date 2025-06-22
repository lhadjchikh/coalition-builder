from django.contrib import admin

from .models import Stakeholder


@admin.register(Stakeholder)
class StakeholderAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization",
        "type",
        "state",
        "county",
        "endorsement_count",
        "created_at",
    )
    list_filter = ("type", "state", "created_at")
    search_fields = ("name", "organization", "email", "county")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Contact Information",
            {
                "fields": (
                    "name",
                    "organization",
                    "role",
                    "email",
                    "state",
                    "county",
                    "type",
                ),
            },
        ),
        (
            "System Fields",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def endorsement_count(self, obj: Stakeholder) -> int:
        """Display count of endorsements"""
        return obj.endorsements.count()

    endorsement_count.short_description = "Endorsements"
