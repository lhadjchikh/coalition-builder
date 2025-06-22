from django.http import Http404, HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.core.models import HomePage

from .schemas import HomePageOut

router = Router()


@router.get("/", response=HomePageOut)
def get_homepage(request: HttpRequest) -> HomePage:
    """Get the active homepage configuration"""
    homepage = HomePage.get_active()
    if not homepage:
        raise Http404("No active homepage configuration found")

    return homepage


@router.get("/{homepage_id}/", response=HomePageOut)
def get_homepage_by_id(request: HttpRequest, homepage_id: int) -> HomePage:
    """Get a specific homepage configuration by ID with content blocks"""
    return get_object_or_404(HomePage, id=homepage_id)
