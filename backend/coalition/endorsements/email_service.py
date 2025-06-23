"""
Email service for endorsement verification and notifications
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Endorsement

logger = logging.getLogger(__name__)


class EndorsementEmailService:
    """Service for sending endorsement-related emails"""

    @staticmethod
    def send_verification_email(endorsement: Endorsement) -> bool:
        """
        Send email verification to stakeholder
        Returns True if email was sent successfully
        """
        try:
            # Generate verification URL
            verification_url = (
                f"{settings.SITE_URL}/verify-endorsement/"
                f"{endorsement.verification_token}/"
            )

            # Email context
            context = {
                "endorsement": endorsement,
                "stakeholder": endorsement.stakeholder,
                "campaign": endorsement.campaign,
                "verification_url": verification_url,
                "site_url": settings.SITE_URL,
                "organization_name": settings.ORGANIZATION_NAME,
            }

            # Render email content
            subject = f"Please verify your endorsement for {endorsement.campaign.title}"

            # HTML email content
            html_message = render_to_string(
                "emails/endorsement_verification.html",
                context,
            )

            # Plain text fallback
            plain_message = render_to_string(
                "emails/endorsement_verification.txt",
                context,
            )

            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[endorsement.stakeholder.email],
                html_message=html_message,
                fail_silently=False,
            )

            if success:
                # Update verification sent timestamp
                endorsement.verification_sent_at = timezone.now()
                endorsement.save(update_fields=["verification_sent_at"])

                logger.info(
                    f"Verification email sent to {endorsement.stakeholder.email} "
                    f"for endorsement {endorsement.id}",
                )
                return True
            else:
                logger.error(
                    f"Failed to send verification email for endorsement "
                    f"{endorsement.id}",
                )
                return False

        except Exception as e:
            logger.error(
                f"Error sending verification email for endorsement "
                f"{endorsement.id}: {str(e)}",
            )
            return False

    @staticmethod
    def send_admin_notification(endorsement: Endorsement) -> bool:
        """
        Send notification to admins about new endorsement requiring review
        Returns True if email was sent successfully
        """
        try:
            # Get admin emails from settings or use a default
            admin_emails = getattr(settings, "ADMIN_NOTIFICATION_EMAILS", "")
            if isinstance(admin_emails, str):
                admin_emails = [
                    email.strip() for email in admin_emails.split(",") if email.strip()
                ]

            if not admin_emails and hasattr(settings, "ADMINS"):
                admin_emails = [email for name, email in settings.ADMINS]

            if not admin_emails:
                logger.warning(
                    "No admin emails configured for endorsement notifications",
                )
                return False

            # Email context
            context = {
                "endorsement": endorsement,
                "stakeholder": endorsement.stakeholder,
                "campaign": endorsement.campaign,
                "admin_url": (
                    f"{settings.API_URL}/admin/endorsements/endorsement/"
                    f"{endorsement.id}/change/"
                ),
                "organization_name": settings.ORGANIZATION_NAME,
            }

            # Render email content
            subject = f"New endorsement requires review: {endorsement.campaign.title}"

            # HTML email content
            html_message = render_to_string(
                "emails/admin_endorsement_notification.html",
                context,
            )

            # Plain text fallback
            plain_message = render_to_string(
                "emails/admin_endorsement_notification.txt",
                context,
            )

            # Send email to all admins
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                html_message=html_message,
                fail_silently=False,
            )

            if success:
                logger.info(f"Admin notification sent for endorsement {endorsement.id}")
                return True
            else:
                logger.error(
                    f"Failed to send admin notification for endorsement "
                    f"{endorsement.id}",
                )
                return False

        except Exception as e:
            logger.error(
                f"Error sending admin notification for endorsement "
                f"{endorsement.id}: {str(e)}",
            )
            return False

    @staticmethod
    def send_confirmation_email(endorsement: Endorsement) -> bool:
        """
        Send confirmation email to stakeholder when endorsement is approved
        Returns True if email was sent successfully
        """
        try:
            # Email context
            context = {
                "endorsement": endorsement,
                "stakeholder": endorsement.stakeholder,
                "campaign": endorsement.campaign,
                "campaign_url": (
                    f"{settings.SITE_URL}/campaigns/{endorsement.campaign.id}/"
                ),
                "organization_name": settings.ORGANIZATION_NAME,
            }

            # Render email content
            subject = (
                f"Your endorsement for {endorsement.campaign.title} has been approved"
            )

            # HTML email content
            html_message = render_to_string("emails/endorsement_approved.html", context)

            # Plain text fallback
            plain_message = render_to_string("emails/endorsement_approved.txt", context)

            # Send email
            success = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[endorsement.stakeholder.email],
                html_message=html_message,
                fail_silently=False,
            )

            if success:
                logger.info(
                    f"Approval confirmation sent to {endorsement.stakeholder.email} "
                    f"for endorsement {endorsement.id}",
                )
                return True
            else:
                logger.error(
                    f"Failed to send approval confirmation for endorsement "
                    f"{endorsement.id}",
                )
                return False

        except Exception as e:
            logger.error(
                f"Error sending approval confirmation for endorsement "
                f"{endorsement.id}: {str(e)}",
            )
            return False
