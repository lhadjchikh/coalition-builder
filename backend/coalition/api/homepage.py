from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.content.models import HomePage

from .schemas import HomePageOut

router = Router()


def create_default_homepage() -> HomePage:
    """Create and return a default homepage configuration."""
    return HomePage.objects.create(
        organization_name="Coalition Builder",
        tagline="Building strong advocacy partnerships",
        hero_title="Welcome to Coalition Builder",
        hero_subtitle="Empowering advocates to build strong policy coalitions",
        about_section_title="About Our Mission",
        about_section_content=(
            "We believe in the power of collective action to drive "
            "meaningful policy change."
        ),
        cta_title="Get Involved",
        cta_content="Join our coalition and help make a difference.",
        cta_button_text="Learn More",
        cta_button_url="",
        contact_email="info@example.org",
        campaigns_section_title="Policy Campaigns",
        show_campaigns_section=True,
        is_active=True,
    )


@router.get("/", response=HomePageOut)
def get_homepage(request: HttpRequest) -> HomePage:
    """Get the active homepage configuration"""
    homepage = HomePage.get_active()
    if not homepage:
        # Create a default homepage if none exists
        homepage = create_default_homepage()

    return homepage


@router.get("/{homepage_id}/", response=HomePageOut)
def get_homepage_by_id(request: HttpRequest, homepage_id: int) -> HomePage:
    """Get a specific homepage configuration by ID with content blocks"""
    return get_object_or_404(HomePage, id=homepage_id)
