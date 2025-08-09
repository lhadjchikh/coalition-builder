from typing import Any

from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils import timezone
from django.utils.html import format_html

from .email_service import EndorsementEmailService
from .models import Endorsement


@admin.register(Endorsement)
class EndorsementAdmin(admin.ModelAdmin):
    list_display = (
        "stakeholder_name",
        "stakeholder_organization",
        "endorsement_type",
        "campaign",
        "status_badge",
        "email_verified_badge",
        "public_display",
        "display_publicly",
        "created_at",
        "reviewed_by",
    )
    list_filter = (
        "status",
        "email_verified",
        "public_display",
        "display_publicly",
        "created_at",
        "campaign",
        "stakeholder__type",
        "stakeholder__state",
    )
    search_fields = (
        "stakeholder__first_name",
        "stakeholder__last_name",
        "stakeholder__organization",
        "stakeholder__email",
        "campaign__title",
        "statement",
    )
    raw_id_fields = ("stakeholder", "campaign", "reviewed_by")
    ordering = ("-created_at",)
    readonly_fields = (
        "verification_token",
        "verification_sent_at",
        "verified_at",
        "terms_accepted",
        "terms_accepted_at",
        "org_authorized",
        "created_at",
        "updated_at",
        "verification_link",
    )

    fieldsets = (
        (
            "Endorsement Details",
            {
                "fields": (
                    "stakeholder",
                    "campaign",
                    "statement",
                    "public_display",
                ),
            },
        ),
        (
            "Email Verification",
            {
                "fields": (
                    "email_verified",
                    "verification_token",
                    "verification_link",
                    "verification_sent_at",
                    "verified_at",
                ),
            },
        ),
        (
            "Admin Review",
            {
                "fields": (
                    "status",
                    "display_publicly",
                    "admin_notes",
                    "reviewed_by",
                    "reviewed_at",
                ),
            },
        ),
        (
            "Terms & Authorization",
            {
                "fields": (
                    "terms_accepted",
                    "terms_accepted_at",
                    "org_authorized",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    actions = [
        "approve_endorsements",
        "reject_endorsements",
        "mark_verified",
        "send_verification_emails",
        "send_approval_notifications",
        "approve_for_display",
        "remove_from_display",
    ]

    @admin.display(description="Name", ordering="stakeholder__last_name")
    def stakeholder_name(self, obj: Endorsement) -> str:
        return obj.stakeholder.name

    @admin.display(description="Organization", ordering="stakeholder__organization")
    def stakeholder_organization(self, obj: Endorsement) -> str:
        return obj.stakeholder.organization

    @admin.display(description="Endorsement Type")
    def endorsement_type(self, obj: Endorsement) -> str:
        if not obj.stakeholder.organization:
            return "Individual"
        elif obj.org_authorized:
            return f"On behalf of {obj.stakeholder.organization}"
        else:
            return f"Individual (affiliated with {obj.stakeholder.organization})"

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj: Endorsement) -> str:
        colors = {
            "pending": "#ffc107",  # warning yellow
            "verified": "#17a2b8",  # info blue
            "approved": "#28a745",  # success green
            "rejected": "#dc3545",  # danger red
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    @admin.display(description="Email", ordering="email_verified")
    def email_verified_badge(self, obj: Endorsement) -> str:
        if obj.email_verified:
            return format_html('<span style="color: #28a745;">✓ Verified</span>')
        else:
            return format_html('<span style="color: #dc3545;">✗ Unverified</span>')

    @admin.display(description="Verification Link")
    def verification_link(self, obj: Endorsement) -> str:
        if obj.verification_token:
            from django.conf import settings

            url = f"{settings.SITE_URL}/verify-endorsement/{obj.verification_token}/"
            return format_html(
                '<a href="{}" target="_blank">Verification Link</a>',
                url,
            )
        return "No token generated"

    @admin.action(description="Approve selected endorsements")
    def approve_endorsements(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = 0
        for endorsement in queryset:
            if endorsement.status != "approved":
                endorsement.approve(
                    user=request.user if isinstance(request.user, User) else None,
                )
                # Send approval notification
                EndorsementEmailService.send_confirmation_email(endorsement)
                count += 1

        self.message_user(
            request,
            f"Successfully approved {count} endorsement(s) and sent notifications.",
        )

    @admin.action(description="Reject selected endorsements")
    def reject_endorsements(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = 0
        for endorsement in queryset:
            if endorsement.status != "rejected":
                endorsement.reject(
                    user=request.user if isinstance(request.user, User) else None,
                )
                count += 1

        self.message_user(request, f"Successfully rejected {count} endorsement(s).")

    @admin.action(description="Mark as email verified")
    def mark_verified(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = 0
        for endorsement in queryset:
            if not endorsement.email_verified:
                endorsement.verify_email()
                count += 1

        self.message_user(
            request,
            f"Successfully marked {count} endorsement(s) as email verified.",
        )

    @admin.action(description="Send verification emails")
    def send_verification_emails(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = 0
        for endorsement in queryset:
            if (
                not endorsement.email_verified
                and EndorsementEmailService.send_verification_email(endorsement)
            ):
                count += 1

        self.message_user(
            request,
            f"Successfully sent verification emails for {count} endorsement(s).",
        )

    @admin.action(description="Send approval notifications")
    def send_approval_notifications(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = 0
        for endorsement in queryset.filter(status="approved"):
            if EndorsementEmailService.send_confirmation_email(endorsement):
                count += 1

        self.message_user(
            request,
            f"Successfully sent approval notifications for {count} endorsement(s).",
        )

    @admin.action(description="Approve for public display")
    def approve_for_display(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        # Only approve endorsements that meet all requirements
        count = queryset.filter(
            status="approved",
            email_verified=True,
            public_display=True,
        ).update(display_publicly=True)

        self.message_user(
            request,
            f"Successfully approved {count} endorsement(s) for public display.",
        )

    def remove_from_display(
        self,
        request: HttpRequest,
        queryset: QuerySet[Endorsement],
    ) -> None:
        count = queryset.update(display_publicly=False)

        self.message_user(
            request,
            f"Successfully removed {count} endorsement(s) from public display.",
        )

    def save_model(
        self,
        request: HttpRequest,
        obj: Endorsement,
        form: Any,
        change: bool,
    ) -> None:
        # Track who made changes
        if change and "status" in form.changed_data:
            obj.reviewed_by = request.user if isinstance(request.user, User) else None
            obj.reviewed_at = timezone.now()

        super().save_model(request, obj, form, change)
