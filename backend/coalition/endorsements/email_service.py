"""
Email service for endorsement verification and notifications
"""

import logging
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from coalition.content.models import HomePage

from .models import Endorsement

logger = logging.getLogger(__name__)

# Distinctive token matched by the CloudWatch metric filter behind the
# endorsement-email alarm. Changing it requires updating
# terraform/modules/monitoring/main.tf.
DELIVERY_FAILURE_MARKER = "EMAIL_DELIVERY_FAILED"


@dataclass(frozen=True)
class _OutboundEmail:
    """One message to render and send.

    ``template_base`` names the pair of templates to render: ``<base>.txt``
    for the plain-text body and ``<base>.html`` for the HTML alternative.
    """

    subject: str
    template_base: str
    context: dict[str, Any]
    recipients: list[str]
    description: str


def _deliver(email: _OutboundEmail) -> bool:
    """Render and send one message, reporting failure rather than raising.

    A broken mail path must delay a notification without invalidating the
    endorsement it describes. Failures are logged with a traceback and the
    delivery-failure marker so they still page an operator.
    """
    try:
        plain_message = render_to_string(f"{email.template_base}.txt", email.context)
        html_message = render_to_string(f"{email.template_base}.html", email.context)
        sent_count = send_mail(
            subject=email.subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=email.recipients,
            html_message=html_message,
            fail_silently=False,
        )
    except Exception:
        logger.exception(
            "%s: could not send %s",
            DELIVERY_FAILURE_MARKER,
            email.description,
        )
        return False

    if not sent_count:
        logger.error(
            "%s: mail backend accepted no recipients for %s",
            DELIVERY_FAILURE_MARKER,
            email.description,
        )
        return False

    logger.info("Sent %s", email.description)
    return True


def _admin_notification_recipients() -> list[str]:
    """Resolve configured admin addresses, tolerating a comma-separated string."""
    configured = getattr(settings, "ADMIN_NOTIFICATION_EMAILS", "")
    if isinstance(configured, str):
        return [address.strip() for address in configured.split(",") if address.strip()]
    if configured:
        return list(configured)
    return [address for _name, address in getattr(settings, "ADMINS", [])]


def _organization_name() -> str:
    """Return the public organization's name from the active homepage."""
    try:
        homepage = HomePage.get_active()
    except Exception:
        logger.exception(
            "Could not load active homepage branding; using configured fallback",
        )
        return settings.ORGANIZATION_NAME
    if homepage:
        return homepage.organization_name
    return settings.ORGANIZATION_NAME


class EndorsementEmailService:
    """Service for sending endorsement-related emails"""

    @staticmethod
    def send_verification_email(endorsement: Endorsement) -> bool:
        """Send email verification to the stakeholder.

        Returns True if the message was accepted for delivery.
        """
        verification_url = (
            f"{settings.SITE_URL}/verify-endorsement/{endorsement.verification_token}/"
        )
        delivered = _deliver(
            _OutboundEmail(
                subject=(
                    f"Please verify your endorsement for {endorsement.campaign.title}"
                ),
                template_base="emails/endorsement_verification",
                context={
                    "endorsement": endorsement,
                    "stakeholder": endorsement.stakeholder,
                    "campaign": endorsement.campaign,
                    "verification_url": verification_url,
                    "site_url": settings.SITE_URL,
                    "organization_name": _organization_name(),
                },
                recipients=[endorsement.stakeholder.email],
                description=f"verification email for endorsement {endorsement.id}",
            ),
        )

        if delivered:
            endorsement.verification_sent_at = timezone.now()
            endorsement.save(update_fields=["verification_sent_at"])

        return delivered

    @staticmethod
    def send_admin_notification(endorsement: Endorsement) -> bool:
        """Notify admins that a new endorsement needs review."""
        recipients = _admin_notification_recipients()
        if not recipients:
            logger.warning("No admin emails configured for endorsement notifications")
            return False

        return _deliver(
            _OutboundEmail(
                subject=(
                    f"New endorsement requires review: {endorsement.campaign.title}"
                ),
                template_base="emails/admin_endorsement_notification",
                context={
                    "endorsement": endorsement,
                    "stakeholder": endorsement.stakeholder,
                    "campaign": endorsement.campaign,
                    "admin_url": (
                        f"{settings.API_URL}/admin/endorsements/endorsement/"
                        f"{endorsement.id}/change/"
                    ),
                    "organization_name": _organization_name(),
                },
                recipients=recipients,
                description=f"admin notification for endorsement {endorsement.id}",
            ),
        )

    @staticmethod
    def send_confirmation_email(endorsement: Endorsement) -> bool:
        """Confirm to the stakeholder that their endorsement was approved."""
        return _deliver(
            _OutboundEmail(
                subject=(
                    f"Your endorsement for {endorsement.campaign.title} "
                    "has been approved"
                ),
                template_base="emails/endorsement_approved",
                context={
                    "endorsement": endorsement,
                    "stakeholder": endorsement.stakeholder,
                    "campaign": endorsement.campaign,
                    "campaign_url": (
                        f"{settings.SITE_URL}/campaigns/{endorsement.campaign.name}/"
                    ),
                    "organization_name": _organization_name(),
                },
                recipients=[endorsement.stakeholder.email],
                description=f"approval confirmation for endorsement {endorsement.id}",
            ),
        )
