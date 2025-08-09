"""API endpoints for legal documents."""

from typing import Any

from django.http import HttpRequest
from ninja import Router

from coalition.legal.models import LegalDocument

router = Router()


@router.get("/terms/", response={200: dict, 404: dict}, tags=["Legal"])
def get_terms_of_use(request: HttpRequest) -> dict[str, Any] | tuple[int, dict[str, str]]:
    """
    Get the currently active Terms of Use document.

    Returns the active Terms of Use document with content for display
    on the legal pages and for acceptance tracking.
    """
    terms = LegalDocument.get_active_document("terms")

    if not terms:
        return 404, {
            "error": "No active Terms of Use document found",
            "message": "Terms of Use have not been configured yet",
        }

    return {
        "id": terms.id,
        "title": terms.title,
        "content": terms.content,
        "version": terms.version,
        "effective_date": terms.effective_date.isoformat(),
        "document_type": terms.document_type,
    }


@router.get("/privacy/", response={200: dict, 404: dict}, tags=["Legal"])
def get_privacy_policy(request: HttpRequest) -> dict[str, Any] | tuple[int, dict[str, str]]:
    """
    Get the currently active Privacy Policy document.

    Returns the active Privacy Policy document for display
    on legal pages.
    """
    privacy = LegalDocument.get_active_document("privacy")

    if not privacy:
        return 404, {
            "error": "No active Privacy Policy document found",
            "message": "Privacy Policy has not been configured yet",
        }

    return {
        "id": privacy.id,
        "title": privacy.title,
        "content": privacy.content,
        "version": privacy.version,
        "effective_date": privacy.effective_date.isoformat(),
        "document_type": privacy.document_type,
    }


@router.get("/documents/", response=list[dict], tags=["Legal"])
def list_legal_documents(request: HttpRequest) -> list[dict[str, Any]]:
    """
    List all active legal documents.

    Returns a list of all currently active legal documents
    for displaying legal page links in the footer.
    """
    documents = LegalDocument.objects.filter(is_active=True)

    return [
        {
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "document_type_display": doc.get_document_type_display(),
            "version": doc.version,
            "effective_date": doc.effective_date.isoformat(),
        }
        for doc in documents
    ]
