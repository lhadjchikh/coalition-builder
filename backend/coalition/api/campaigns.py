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


@router.get("/by-name/{name}/", response=PolicyCampaignOut)
def get_campaign_by_name(request: HttpRequest, name: str) -> PolicyCampaign:
    """Get a specific campaign by name"""
    return get_object_or_404(PolicyCampaign, name=name, active=True)


@router.get("/{campaign_id}/", response=PolicyCampaignOut)
def get_campaign(request: HttpRequest, campaign_id: int) -> PolicyCampaign:
    """Get a specific campaign by ID"""
    return get_object_or_404(PolicyCampaign, id=campaign_id, active=True)
