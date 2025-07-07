from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router

from coalition.campaigns.models import PolicyCampaign

from .schemas import PolicyCampaignOut

router = Router()


@router.get("/", response=list[PolicyCampaignOut])
def list_campaigns(request: HttpRequest) -> list[PolicyCampaign]:
    """
    List all active policy campaigns.

    Returns all campaigns that are currently active and accepting endorsements.
    Campaigns are ordered by creation date (newest first).

    Returns:
        List of PolicyCampaignOut objects containing campaign details
    """
    return PolicyCampaign.objects.filter(active=True).all()


@router.get("/by-name/{name}/", response=PolicyCampaignOut)
def get_campaign_by_name(request: HttpRequest, name: str) -> PolicyCampaign:
    """
    Retrieve a specific campaign by its machine-readable name.

    Args:
        name: The slug/machine-readable name of the campaign

    Returns:
        PolicyCampaignOut object with full campaign details

    Raises:
        404: If no campaign exists with the given name
    """
    return get_object_or_404(PolicyCampaign, name=name, active=True)


@router.get("/{campaign_id}/", response=PolicyCampaignOut)
def get_campaign(request: HttpRequest, campaign_id: int) -> PolicyCampaign:
    """Get a specific campaign by ID"""
    return get_object_or_404(PolicyCampaign, id=campaign_id, active=True)
