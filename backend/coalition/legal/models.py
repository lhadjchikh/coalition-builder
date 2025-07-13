"""Models for managing legal documents and user acceptance."""

import uuid
from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone

from coalition.content.html_sanitizer import HTMLSanitizer

if TYPE_CHECKING:
    from typing import Any


class LegalDocument(models.Model):
    """
    Model for storing legal documents like Terms of Use, Privacy Policy, etc.

    Supports versioning and tracking of active documents.
    Only one document of each type can be active at a time.
    """

    DOCUMENT_TYPES = [
        ("terms", "Terms of Use"),
        ("privacy", "Privacy Policy"),
        ("cookies", "Cookie Policy"),
        ("acceptable_use", "Acceptable Use Policy"),
    ]

    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES,
        help_text="Type of legal document",
    )

    title = models.CharField(
        max_length=200,
        help_text="Title of the document",
    )

    content = models.TextField(
        help_text="Full content of the legal document (HTML allowed)",
    )

    version = models.CharField(
        max_length=20,
        help_text="Version identifier (e.g., '1.0', '2023-12-01')",
    )

    is_active = models.BooleanField(
        default=False,
        help_text="Whether this is the currently active version",
    )

    effective_date = models.DateTimeField(
        default=timezone.now,
        help_text="When this version becomes/became effective",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this document was created",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this document was last updated",
    )

    created_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_legal_documents",
        help_text="Admin user who created this document",
    )

    class Meta:
        db_table = "legal_document"
        ordering = ["-effective_date", "-created_at"]
        indexes = [
            models.Index(fields=["document_type", "is_active"]),
            models.Index(fields=["effective_date"]),
        ]
        unique_together = [
            ["document_type", "version"],
        ]

    def __str__(self) -> str:
        active_marker = " (ACTIVE)" if self.is_active else ""
        return f"{self.get_document_type_display()} v{self.version}{active_marker}"

    def save(self, *args: "Any", **kwargs: "Any") -> None:
        """Ensure only one active document per type and sanitize content."""
        # Sanitize content before saving
        if self.content:
            self.content = HTMLSanitizer.sanitize(self.content)

        if self.title:
            self.title = HTMLSanitizer.sanitize_plain_text(self.title)

        # If this document is being set as active, deactivate others of same type
        if self.is_active:
            LegalDocument.objects.filter(
                document_type=self.document_type,
                is_active=True,
            ).exclude(pk=self.pk).update(is_active=False)

        super().save(*args, **kwargs)

    @classmethod
    def get_active_document(cls, document_type: str) -> "LegalDocument | None":
        """Get the currently active document of a specific type."""
        return cls.objects.filter(document_type=document_type, is_active=True).first()


class TermsAcceptance(models.Model):
    """
    Track acceptance of legal documents by endorsers.

    This model records when someone accepts specific versions of legal documents,
    particularly Terms of Use during the endorsement process.
    """

    endorsement = models.ForeignKey(
        "endorsements.Endorsement",
        on_delete=models.CASCADE,
        related_name="terms_acceptances",
        help_text="The endorsement this acceptance is associated with",
    )

    legal_document = models.ForeignKey(
        LegalDocument,
        on_delete=models.PROTECT,  # Don't allow deletion of accepted documents
        related_name="acceptances",
        help_text="The specific version of the document that was accepted",
    )

    accepted_at = models.DateTimeField(
        default=timezone.now,
        help_text="When the terms were accepted",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address from which terms were accepted",
    )

    user_agent = models.TextField(
        blank=True,
        help_text="Browser user agent string at time of acceptance",
    )

    acceptance_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text="Unique token for this acceptance record",
    )

    class Meta:
        db_table = "terms_acceptance"
        ordering = ["-accepted_at"]
        indexes = [
            models.Index(fields=["accepted_at"]),
            models.Index(fields=["endorsement", "legal_document"]),
        ]

    def __str__(self) -> str:
        return (
            f"{self.endorsement.stakeholder} accepted "
            f"{self.legal_document} at {self.accepted_at}"
        )
