"""Read-only public endpoints for team listings and biography pages."""

from django.db.models import QuerySet
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.content.models import Person, PersonGroup

from .schemas import PersonDetailOut, PersonGroupOut

router = Router()


@router.get("/", response=list[PersonGroupOut])
def list_people(request: HttpRequest) -> QuerySet[PersonGroup]:
    """List visible groups containing active people in staff-defined order."""
    return PersonGroup.objects.with_public_people()


@router.get("/{person_slug}/", response=PersonDetailOut)
def get_person_profile(request: HttpRequest, person_slug: str) -> Person:
    """Get one active, publicly enabled biography within a visible group."""
    return get_object_or_404(
        Person.objects.select_related("group", "profile_image"),
        slug=person_slug,
        is_active=True,
        profile_page_enabled=True,
        group__is_visible=True,
    )
