from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.campaigns.models import PolicyCampaign

from .schemas import PolicyCampaignOut

router = Router()


@router.get("/", response=list[PolicyCampaignOut] | PolicyCampaignOut)
def list_campaigns(
    request: HttpRequest,
    name: str = None,
) -> list[PolicyCampaign] | PolicyCampaign:
    """List all active campaigns, or get a specific campaign by name"""
    queryset = PolicyCampaign.objects.filter(active=True)

    # If name is provided, return single campaign
    if name is not None:
        return get_object_or_404(queryset, name=name)

    return queryset.all()


@router.get("/{campaign_id}/", response=PolicyCampaignOut)
def get_campaign(request: HttpRequest, campaign_id: int) -> PolicyCampaign:
    """Get a specific campaign by ID"""
    return get_object_or_404(PolicyCampaign, id=campaign_id, active=True)
