import csv
import json
import logging
import uuid

from django.db import IntegrityError, transaction
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.email_service import EndorsementEmailService
from coalition.endorsements.models import Endorsement
from coalition.endorsements.spam_prevention import SpamPreventionService, get_client_ip
from coalition.stakeholders.models import Stakeholder

from .schemas import EndorsementCreateSchema, EndorsementOut, EndorsementVerifySchema

router = Router()
logger = logging.getLogger(__name__)


def sanitize_csv_field(value: str) -> str:
    """
    Sanitize CSV field to prevent formula injection attacks.

    Prefixes dangerous characters with single quote as per security best practices.
    This prevents formula execution while preserving original data content.
    """
    if not isinstance(value, str):
        return str(value)

    # Strip whitespace first
    value = value.strip()

    # If field starts with dangerous characters, prefix with single quote
    # This is the industry standard approach recommended by security experts
    if value and value[0] in ("=", "+", "-", "@", "|"):
        return "'" + value

    # Clean up problematic whitespace characters
    value = value.replace("\r", " ").replace("\n", " ").replace("\t", " ")

    return value


@router.get("/", response=list[EndorsementOut])
def list_endorsements(
    request: HttpRequest,
    campaign_id: int = None,
) -> list[Endorsement]:
    """List all approved public endorsements, optionally filtered by campaign"""
    queryset = Endorsement.objects.select_related("stakeholder", "campaign").filter(
        status="approved",
        public_display=True,
        email_verified=True,
    )

    # Filter by campaign if campaign_id is provided
    if campaign_id is not None:
        queryset = queryset.filter(campaign_id=campaign_id)

    return queryset.order_by("-created_at").all()


@router.post("/", response=EndorsementOut)
def create_endorsement(
    request: HttpRequest,
    data: EndorsementCreateSchema,
) -> Endorsement:
    """Create a new endorsement with stakeholder deduplication and spam prevention"""
    # Get client IP address with validation and spoofing protection
    ip_address = get_client_ip(request)

    # Verify campaign exists and allows endorsements
    campaign = get_object_or_404(PolicyCampaign, id=data.campaign_id)
    if not campaign.allow_endorsements:
        raise HttpError(400, "This campaign is not accepting endorsements")

    # Run spam prevention checks
    stakeholder_data = {
        "name": data.stakeholder.name,
        "organization": data.stakeholder.organization,
        "role": data.stakeholder.role,
        "email": data.stakeholder.email,
        "state": data.stakeholder.state,
        "county": data.stakeholder.county,
        "type": data.stakeholder.type,
    }

    # Get form metadata (honeypot fields, timing, etc.)
    form_data = getattr(data, "form_metadata", {})

    spam_check = SpamPreventionService.comprehensive_spam_check(
        request=request,
        stakeholder_data=stakeholder_data,
        statement=data.statement,
        form_data=form_data,
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

    # Record the submission attempt for rate limiting
    SpamPreventionService.record_submission_attempt(request)

    # Handle spam detection
    if spam_check["is_spam"]:
        logger.warning(f"Spam detected from IP {ip_address}: {spam_check['reasons']}")
        raise HttpError(400, "Submission rejected due to spam detection")

    # Log suspicious activity for review
    if spam_check["confidence_score"] > 0.2:
        logger.info(
            f"Suspicious endorsement from IP {ip_address}: {spam_check['reasons']}",
        )

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
                    "status": "pending",  # Start as pending verification
                },
            )

            # If endorsement already exists, update it
            if not created:
                endorsement.statement = data.statement
                endorsement.public_display = data.public_display
                # Reset status to pending if updating
                endorsement.status = "pending"
                endorsement.email_verified = False
                endorsement.verified_at = None  # Clear verified_at timestamp
                endorsement.verification_token = uuid.uuid4()  # Generate new token
                endorsement.save()

            # Send verification email
            email_sent = EndorsementEmailService.send_verification_email(endorsement)
            if not email_sent:
                # Log error with additional context for debugging
                logger.error(
                    f"Failed to send verification email for endorsement "
                    f"{endorsement.id} to {stakeholder.email}. Email delivery failed.",
                )

            # Send admin notification for new endorsements
            if created:
                EndorsementEmailService.send_admin_notification(endorsement)

            return endorsement

    except IntegrityError as e:
        raise HttpError(400, f"Error creating endorsement: {str(e)}") from e
    except Exception as e:
        raise HttpError(500, f"Unexpected error: {str(e)}") from e


@router.post("/verify/{token}/")
def verify_endorsement(request: HttpRequest, token: str) -> dict:
    """Verify an endorsement using the verification token"""
    try:
        # Parse token as UUID
        verification_token = uuid.UUID(token)
    except ValueError as e:
        raise HttpError(400, "Invalid verification token format") from e

    # Find endorsement by token
    endorsement = get_object_or_404(Endorsement, verification_token=verification_token)

    # Check if already verified
    if endorsement.email_verified:
        return {
            "success": True,
            "message": "Email already verified",
            "status": endorsement.status,
        }

    # Check if token is expired
    if endorsement.is_verification_expired:
        raise HttpError(400, "Verification link has expired. Please request a new one.")

    # Verify the endorsement
    endorsement.verify_email()

    # Send confirmation email
    EndorsementEmailService.send_confirmation_email(endorsement)

    return {
        "success": True,
        "message": "Email verified successfully! Your endorsement is now under review.",
        "status": endorsement.status,
    }


@router.post("/resend-verification/")
def resend_verification(request: HttpRequest, data: EndorsementVerifySchema) -> dict:
    """Resend verification email for an endorsement"""
    # Apply rate limiting to prevent abuse
    spam_check = SpamPreventionService.check_rate_limit(request)
    if not spam_check["allowed"]:
        raise HttpError(429, "Too many verification requests. Please try again later.")

    # Record this attempt for rate limiting
    SpamPreventionService.record_submission_attempt(request)

    # Always return the same message to prevent information disclosure
    # This prevents enumeration of which emails have endorsed campaigns
    standard_message = (
        "If an endorsement exists for this email and campaign, "
        "a verification email has been sent."
    )

    try:
        # Find endorsement by stakeholder email and campaign
        endorsement = Endorsement.objects.filter(
            stakeholder__email__iexact=data.email,
            campaign_id=data.campaign_id,
        ).first()

        # Only send email if endorsement exists and is not already verified
        if endorsement and not endorsement.email_verified:
            EndorsementEmailService.send_verification_email(endorsement)

        # Always return the same response regardless of whether endorsement exists
        return {
            "success": True,
            "message": standard_message,
        }

    except Exception as e:
        # Log the error but still return the standard message
        logger.error(f"Error in resend verification: {e}")
        return {
            "success": True,
            "message": standard_message,
        }


@router.post("/admin/approve/{endorsement_id}/")
def admin_approve_endorsement(request: HttpRequest, endorsement_id: int) -> dict:
    """Admin endpoint to approve an endorsement"""
    # Require staff/admin access for endorsement approval
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for endorsement approval")

    endorsement = get_object_or_404(Endorsement, id=endorsement_id)

    if endorsement.status == "approved":
        return {
            "success": True,
            "message": "Endorsement was already approved",
        }

    endorsement.approve(user=request.user)

    # Send confirmation email
    EndorsementEmailService.send_confirmation_email(endorsement)

    return {
        "success": True,
        "message": "Endorsement approved successfully",
        "status": endorsement.status,
    }


@router.post("/admin/reject/{endorsement_id}/")
def admin_reject_endorsement(request: HttpRequest, endorsement_id: int) -> dict:
    """Admin endpoint to reject an endorsement"""
    # Require staff/admin access for endorsement rejection
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for endorsement rejection")

    endorsement = get_object_or_404(Endorsement, id=endorsement_id)

    if endorsement.status == "rejected":
        return {
            "success": True,
            "message": "Endorsement was already rejected",
        }

    endorsement.reject(user=request.user)

    return {
        "success": True,
        "message": "Endorsement rejected successfully",
        "status": endorsement.status,
    }


@router.get("/admin/pending/")
def admin_list_pending_endorsements(request: HttpRequest) -> list[EndorsementOut]:
    """Admin endpoint to list endorsements requiring review"""
    # Require staff/admin access for pending endorsements list
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for pending endorsements list")

    queryset = (
        Endorsement.objects.select_related("stakeholder", "campaign")
        .filter(status__in=["pending", "verified"])
        .order_by("-created_at")
    )

    return list(queryset.all())


@router.get("/export/csv/")
def export_endorsements_csv(
    request: HttpRequest,
    campaign_id: int = None,
) -> HttpResponse:
    """Export endorsements to CSV format (admin only)"""
    # Require staff/admin access for data export
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for data export")

    # Get approved endorsements
    queryset = Endorsement.objects.select_related("stakeholder", "campaign").filter(
        status="approved",
        email_verified=True,
    )

    if campaign_id:
        queryset = queryset.filter(campaign_id=campaign_id)
        campaign = get_object_or_404(PolicyCampaign, id=campaign_id)
        filename = f"endorsements_{campaign.name}.csv"
    else:
        filename = "endorsements_all.csv"

    # Create CSV response
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)

    # Write header row
    writer.writerow(
        [
            "Campaign",
            "Campaign ID",
            "Stakeholder Name",
            "Organization",
            "Role",
            "Email",
            "State",
            "County",
            "Type",
            "Statement",
            "Public Display",
            "Email Verified",
            "Status",
            "Created At",
            "Verified At",
            "Reviewed At",
        ],
    )

    # Write data rows with CSV injection protection
    for endorsement in queryset.order_by("campaign__title", "stakeholder__name"):
        writer.writerow(
            [
                sanitize_csv_field(endorsement.campaign.title),
                endorsement.campaign.id,  # Numeric, safe
                sanitize_csv_field(endorsement.stakeholder.name),
                sanitize_csv_field(endorsement.stakeholder.organization),
                sanitize_csv_field(endorsement.stakeholder.role),
                sanitize_csv_field(endorsement.stakeholder.email),
                sanitize_csv_field(endorsement.stakeholder.state),
                sanitize_csv_field(endorsement.stakeholder.county),
                sanitize_csv_field(endorsement.stakeholder.get_type_display()),
                sanitize_csv_field(endorsement.statement),
                "Yes" if endorsement.public_display else "No",  # Safe boolean
                "Yes" if endorsement.email_verified else "No",  # Safe boolean
                sanitize_csv_field(endorsement.get_status_display()),
                endorsement.created_at.strftime("%Y-%m-%d %H:%M:%S"),  # Safe datetime
                (
                    endorsement.verified_at.strftime("%Y-%m-%d %H:%M:%S")
                    if endorsement.verified_at
                    else ""
                ),  # Safe datetime
                (
                    endorsement.reviewed_at.strftime("%Y-%m-%d %H:%M:%S")
                    if endorsement.reviewed_at
                    else ""
                ),  # Safe datetime
            ],
        )

    return response


@router.get("/export/json/")
def export_endorsements_json(
    request: HttpRequest,
    campaign_id: int = None,
) -> HttpResponse:
    """Export endorsements to JSON format (admin only)"""
    # Require staff/admin access for data export
    if not request.user.is_authenticated or not request.user.is_staff:
        raise HttpError(403, "Admin access required for data export")

    # Get approved endorsements
    queryset = Endorsement.objects.select_related("stakeholder", "campaign").filter(
        status="approved",
        email_verified=True,
    )

    if campaign_id:
        queryset = queryset.filter(campaign_id=campaign_id)
        campaign = get_object_or_404(PolicyCampaign, id=campaign_id)
        filename = f"endorsements_{campaign.name}.json"
    else:
        filename = "endorsements_all.json"

    # Build JSON data
    data = {
        "export_info": {
            "exported_at": timezone.now().isoformat(),
            "total_count": queryset.count(),
            "campaign_filter": campaign_id,
        },
        "endorsements": [],
    }

    for endorsement in queryset.order_by("campaign__title", "stakeholder__name"):
        data["endorsements"].append(
            {
                "id": endorsement.id,
                "campaign": {
                    "id": endorsement.campaign.id,
                    "name": endorsement.campaign.name,
                    "title": endorsement.campaign.title,
                },
                "stakeholder": {
                    "id": endorsement.stakeholder.id,
                    "name": endorsement.stakeholder.name,
                    "organization": endorsement.stakeholder.organization,
                    "role": endorsement.stakeholder.role,
                    "email": endorsement.stakeholder.email,
                    "state": endorsement.stakeholder.state,
                    "county": endorsement.stakeholder.county,
                    "type": endorsement.stakeholder.type,
                },
                "statement": endorsement.statement,
                "public_display": endorsement.public_display,
                "email_verified": endorsement.email_verified,
                "status": endorsement.status,
                "created_at": endorsement.created_at.isoformat(),
                "verified_at": (
                    endorsement.verified_at.isoformat()
                    if endorsement.verified_at
                    else None
                ),
                "reviewed_at": (
                    endorsement.reviewed_at.isoformat()
                    if endorsement.reviewed_at
                    else None
                ),
            },
        )

    # Create JSON response
    response = HttpResponse(json.dumps(data, indent=2), content_type="application/json")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    return response
