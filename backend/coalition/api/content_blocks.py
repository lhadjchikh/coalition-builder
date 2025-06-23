from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.core.models import ContentBlock

from .schemas import ContentBlockOut

router = Router()


@router.get("/", response=list[ContentBlockOut])
def list_content_blocks(
    request: HttpRequest,
    homepage_id: int = None,
) -> list[ContentBlock]:
    """List all visible content blocks, optionally filtered by homepage"""
    queryset = ContentBlock.objects.filter(is_visible=True).select_related("homepage")

    # Filter by homepage if homepage_id is provided
    if homepage_id is not None:
        queryset = queryset.filter(homepage_id=homepage_id)

    return queryset.order_by("order").all()


@router.get("/{block_id}/", response=ContentBlockOut)
def get_content_block(request: HttpRequest, block_id: int) -> ContentBlock:
    """Get a specific content block by ID"""
    return get_object_or_404(ContentBlock, id=block_id, is_visible=True)
