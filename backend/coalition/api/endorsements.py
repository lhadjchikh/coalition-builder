from django.db import IntegrityError, transaction
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder

from .schemas import EndorsementCreateSchema, EndorsementOut

router = Router()


@router.get("/", response=list[EndorsementOut])
def list_endorsements(request: HttpRequest) -> list[Endorsement]:
    """List all public endorsements"""
    return (
        Endorsement.objects.select_related("stakeholder", "campaign")
        .filter(public_display=True)
        .all()
    )


@router.get("/campaign/{campaign_id}/", response=list[EndorsementOut])
def list_campaign_endorsements(
    request: HttpRequest,
    campaign_id: int,
) -> list[Endorsement]:
    """List all public endorsements for a specific campaign"""
    return (
        Endorsement.objects.select_related("stakeholder", "campaign")
        .filter(campaign_id=campaign_id, public_display=True)
        .all()
    )


@router.post("/", response=EndorsementOut)
def create_endorsement(
    request: HttpRequest,
    data: EndorsementCreateSchema,
) -> Endorsement:
    """Create a new endorsement with stakeholder deduplication"""
    # Verify campaign exists and allows endorsements
    campaign = get_object_or_404(PolicyCampaign, id=data.campaign_id)
    if not campaign.allow_endorsements:
        raise HttpError(400, "This campaign is not accepting endorsements")

    try:
        with transaction.atomic():
            # Get or create stakeholder (deduplicate by email)
            stakeholder, created = Stakeholder.objects.get_or_create(
                email__iexact=data.stakeholder.email,  # Case-insensitive lookup
                defaults={
                    "name": data.stakeholder.name,
                    "organization": data.stakeholder.organization,
                    "role": data.stakeholder.role,
                    "email": data.stakeholder.email.lower(),  # Normalized in save()
                    "state": data.stakeholder.state.upper(),
                    "county": data.stakeholder.county,
                    "type": data.stakeholder.type,
                },
            )

            # If stakeholder already exists, update their info
            if not created:
                stakeholder.name = data.stakeholder.name
                stakeholder.organization = data.stakeholder.organization
                stakeholder.role = data.stakeholder.role
                stakeholder.state = data.stakeholder.state.upper()
                stakeholder.county = data.stakeholder.county
                stakeholder.type = data.stakeholder.type
                stakeholder.save()

            # Create endorsement (unique constraint prevents duplicates)
            endorsement, created = Endorsement.objects.get_or_create(
                stakeholder=stakeholder,
                campaign=campaign,
                defaults={
                    "statement": data.statement,
                    "public_display": data.public_display,
                },
            )

            # If endorsement already exists, update it
            if not created:
                endorsement.statement = data.statement
                endorsement.public_display = data.public_display
                endorsement.save()

            return endorsement

    except IntegrityError as e:
        raise HttpError(400, f"Error creating endorsement: {str(e)}") from e
    except Exception as e:
        raise HttpError(500, f"Unexpected error: {str(e)}") from e
