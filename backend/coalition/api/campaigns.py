from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.campaigns.models import PolicyCampaign

from .schemas import PolicyCampaignOut

router = Router()


@router.get("/", response=list[PolicyCampaignOut])
def list_campaigns(request: HttpRequest) -> list[PolicyCampaign]:
    """List all active campaigns"""
    return PolicyCampaign.objects.filter(active=True).all()


@router.get("/{campaign_id}/", response=PolicyCampaignOut)
def get_campaign(request: HttpRequest, campaign_id: int) -> PolicyCampaign:
    """Get a specific campaign by ID"""
    return get_object_or_404(PolicyCampaign, id=campaign_id, active=True)


@router.get("/slug/{slug}/", response=PolicyCampaignOut)
def get_campaign_by_slug(request: HttpRequest, slug: str) -> PolicyCampaign:
    """Get a specific campaign by slug"""
    return get_object_or_404(PolicyCampaign, slug=slug, active=True)
