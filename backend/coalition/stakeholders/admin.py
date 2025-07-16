from django.contrib import admin

from .models import Stakeholder


@admin.register(Stakeholder)
class StakeholderAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization",
        "type",
        "city",
        "state",
        "county",
        "email_updates",
        "endorsement_count",
        "created_at",
    )
    list_filter = ("type", "state", "email_updates", "created_at")
    search_fields = ("name", "organization", "email", "city", "county", "zip_code")
    ordering = ("-created_at",)
    readonly_fields = (
        "location",
        "congressional_district",
        "state_senate_district",
        "state_house_district",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Contact Information",
            {
                "fields": (
                    "name",
                    "organization",
                    "role",
                    "email",
                    "type",
                    "email_updates",
                ),
            },
        ),
        (
            "Address",
            {
                "fields": (
                    "street_address",
                    "city",
                    "state",
                    "zip_code",
                    "county",
                ),
            },
        ),
        (
            "Geographic Information",
            {
                "fields": (
                    "location",
                    "congressional_district",
                    "state_senate_district",
                    "state_house_district",
                ),
                "description": (
                    "These fields are automatically populated based on the address"
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
