from django.contrib import admin
from django.forms import ModelForm
from django.http import HttpRequest

from .models import LegalDocument, TermsAcceptance


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "document_type",
        "version",
        "is_active",
        "effective_date",
        "created_at",
    ]
    list_filter = ["document_type", "is_active", "effective_date"]
    search_fields = ["title", "version", "content"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("document_type", "title", "version", "is_active")}),
        (
            "Content",
            {
                "fields": ("content",),
                "description": "Use HTML for formatting. Content will be sanitized.",
            },
        ),
        (
            "Timing",
            {
                "fields": ("effective_date",),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(
        self,
        request: HttpRequest,
        obj: LegalDocument,
        form: ModelForm,
        change: bool,
    ) -> None:
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(TermsAcceptance)
class TermsAcceptanceAdmin(admin.ModelAdmin):
    list_display = [
        "endorsement_stakeholder",
        "legal_document_title",
        "document_version",
        "accepted_at",
        "ip_address",
    ]
    list_filter = ["accepted_at", "legal_document__document_type"]
    search_fields = [
        "endorsement__stakeholder__name",
        "endorsement__stakeholder__email",
        "endorsement__stakeholder__organization",
        "legal_document__title",
        "ip_address",
    ]
    readonly_fields = [
        "endorsement",
        "legal_document",
        "accepted_at",
        "ip_address",
        "user_agent",
    ]

    def endorsement_stakeholder(self, obj: TermsAcceptance) -> str:
        if obj.endorsement and obj.endorsement.stakeholder:
            stakeholder = obj.endorsement.stakeholder
            return f"{stakeholder.name} ({stakeholder.organization})"
        return "N/A"

    endorsement_stakeholder.short_description = "Stakeholder"

    def legal_document_title(self, obj: TermsAcceptance) -> str:
        return obj.legal_document.title if obj.legal_document else "N/A"

    legal_document_title.short_description = "Document"

    def document_version(self, obj: TermsAcceptance) -> str:
        return obj.legal_document.version if obj.legal_document else "N/A"

    document_version.short_description = "Version"

    def has_add_permission(self, request: HttpRequest) -> bool:  # noqa: ARG002
        return False

    def has_change_permission(  # noqa: ARG002
        self,
        request: HttpRequest,  # noqa: ARG002
        obj: TermsAcceptance | None = None,  # noqa: ARG002
    ) -> bool:
        return False
