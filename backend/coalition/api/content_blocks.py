from django.db.models import QuerySet
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.content.models import ContentBlock

from .schemas import ContentBlockOut

router = Router()


@router.get("/", response=list[ContentBlockOut])
def list_content_blocks(
    request: HttpRequest,
    page_type: str = None,
) -> QuerySet[ContentBlock]:
    """List all visible content blocks, optionally filtered by page type"""
    queryset = ContentBlock.objects.filter(is_visible=True).select_related("image")

    # Filter by page_type if provided
    if page_type is not None:
        queryset = queryset.filter(page_type=page_type)

    return queryset.order_by("order").all()


@router.get("/{block_id}/", response=ContentBlockOut)
def get_content_block(request: HttpRequest, block_id: int) -> ContentBlock:
    """Get a specific content block by ID"""
    return get_object_or_404(ContentBlock, id=block_id, is_visible=True)
