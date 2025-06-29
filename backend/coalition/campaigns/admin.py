from typing import TYPE_CHECKING

from django.contrib import admin

from .models import Bill, PolicyCampaign

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from django.http import HttpRequest


class BillInline(admin.TabularInline):
    """Inline admin for Bills within PolicyCampaign admin"""

    model = Bill
    extra = 0
    fields = (
        "level",
        "title",
        "chamber",
        "number",
        "session",
        "state",
        "introduced_date",
        "status",
        "is_primary",
    )


@admin.register(PolicyCampaign)
class PolicyCampaignAdmin(admin.ModelAdmin):
    """Admin interface for PolicyCampaign model"""

    inlines = [BillInline]

    list_display = (
        "name",
        "title",
        "allow_endorsements",
        "active",
        "created_at",
        "endorsement_count",
        "bill_count",
    )

    list_filter = ("active", "allow_endorsements", "created_at")

    search_fields = ("name", "title", "summary", "description")

    list_editable = ("active", "allow_endorsements")

    prepopulated_fields = {"name": ("title",)}

    readonly_fields = ("created_at",)

    fieldsets = (
        (
            "Campaign Information",
            {"fields": ("name", "title", "summary", "description", "active")},
        ),
        (
            "Endorsements",
            {
                "fields": (
                    "allow_endorsements",
                    "endorsement_statement",
                    "endorsement_form_instructions",
                ),
                "description": "Configure how endorsements work for this campaign",
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )

    def endorsement_count(self, obj: PolicyCampaign) -> int:
        """Display count of endorsements"""
        return obj.endorsements.count()

    endorsement_count.short_description = "Endorsements"

    def bill_count(self, obj: PolicyCampaign) -> int:
        """Display count of associated bills"""
        return obj.bills.count()

    bill_count.short_description = "Bills"

    def get_queryset(self, request: "HttpRequest") -> "QuerySet[PolicyCampaign]":
        """Order by most recently created first"""
        return super().get_queryset(request).order_by("-created_at")


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    """Admin interface for Bill model"""

    list_display = (
        "policy",
        "level",
        "chamber",
        "number",
        "session",
        "state",
        "title",
        "status",
        "is_primary",
        "introduced_date",
    )

    list_filter = (
        "level",
        "chamber",
        "session",
        "is_primary",
        "policy",
        "introduced_date",
    )

    search_fields = ("number", "title", "policy__title")

    list_editable = ("is_primary",)

    readonly_fields = ()

    filter_horizontal = ("sponsors", "cosponsors")

    fieldsets = (
        (
            "Bill Information",
            {
                "fields": (
                    "policy",
                    "level",
                    "chamber",
                    "number",
                    "title",
                    "session",
                    "state",
                    "introduced_date",
                    "status",
                    "url",
                    "is_primary",
                    "related_bill",
                ),
            },
        ),
        (
            "Legislators",
            {
                "fields": ("sponsors", "cosponsors"),
                "description": "Legislators who sponsor or cosponsor this bill",
            },
        ),
    )

    def get_queryset(self, request: "HttpRequest") -> "QuerySet[Bill]":
        """Order by policy and then by number"""
        return super().get_queryset(request).order_by("policy", "number")
