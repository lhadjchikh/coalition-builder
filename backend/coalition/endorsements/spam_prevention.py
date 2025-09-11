"""
Spam prevention utilities for endorsement forms
"""

import ipaddress
import logging
import re
from datetime import datetime
from typing import Any

from django.conf import settings
from django.http import HttpRequest
from django.utils import timezone

try:
    import akismet
except ImportError:
    akismet = None

try:
    from email_validator import EmailNotValidError, validate_email
except ImportError:
    validate_email = None  # type: ignore[assignment]
    EmailNotValidError = Exception  # type: ignore[misc,assignment]

from coalition.core.database_rate_limiter import get_rate_limiter

logger = logging.getLogger(__name__)


def secure_ip_key(group: str, request: HttpRequest) -> str:
    """
    Custom rate limit key function that uses our secure IP extraction.

    This prevents IP spoofing attacks by using get_client_ip() which validates
    IP addresses and handles proxy headers safely.
    """
    return get_client_ip(request)


def get_client_ip(request: HttpRequest) -> str:
    """
    Securely extract client IP address with validation and spoofing protection.

    Validates IP addresses and handles proxy headers safely to prevent
    rate limit bypass and log pollution attacks.
    """

    def is_valid_ip(ip_str: str) -> bool:
        """Validate if string is a valid IP address."""
        try:
            ipaddress.ip_address(ip_str.strip())
            return True
        except (ValueError, ipaddress.AddressValueError):
            return False

    def is_private_ip(ip_str: str) -> bool:
        """Check if IP is in private/internal range."""
        try:
            ip = ipaddress.ip_address(ip_str.strip())
            return ip.is_private or ip.is_loopback or ip.is_link_local
        except (ValueError, ipaddress.AddressValueError):
            return True  # Treat invalid IPs as private for safety

    # Get the direct connection IP (always trustworthy)
    remote_addr = request.META.get("REMOTE_ADDR", "")

    # If no proxy headers or direct connection from internet, use REMOTE_ADDR
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "").strip()
    if not forwarded_for:
        return remote_addr if is_valid_ip(remote_addr) else "127.0.0.1"

    # Parse X-Forwarded-For header (format: client, proxy1, proxy2, ...)
    forwarded_ips = [ip.strip() for ip in forwarded_for.split(",")]

    # Only trust proxy headers if the direct connection is from a private IP
    # This prevents arbitrary header spoofing from internet clients
    remote_is_private = is_private_ip(remote_addr)
    if not remote_is_private:
        # Direct internet connection - ignore potentially spoofed headers
        return remote_addr if is_valid_ip(remote_addr) else "127.0.0.1"

    # Connection is from private IP (reverse proxy/load balancer)
    # Find the first valid public IP in the chain
    for ip in forwarded_ips:
        if is_valid_ip(ip) and not is_private_ip(ip):
            return str(ip)

    # No valid public IP found, fall back to REMOTE_ADDR
    return remote_addr if is_valid_ip(remote_addr) else "127.0.0.1"


class SpamPreventionService:
    """Service for preventing spam in endorsement submissions"""

    # Rate limiting settings
    RATE_LIMIT_WINDOW = getattr(
        settings,
        "ENDORSEMENT_RATE_LIMIT_WINDOW",
        300,
    )  # 5 minutes
    RATE_LIMIT_MAX_ATTEMPTS = getattr(
        settings,
        "ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS",
        3,
    )

    # Known disposable email domains (fallback when email-validator unavailable)
    # email-validator handles most disposable domains automatically
    SUSPICIOUS_DOMAINS = [
        "mailinator.com",
        "10minutemail.com",
        "guerrillamail.com",
        "temp-mail.org",
        "throwaway.email",
    ]

    @classmethod
    def check_rate_limit(
        cls,
        request: HttpRequest,
    ) -> dict[str, Any]:
        """
        Check if request has exceeded rate limit using database-backed rate limiter.
        Returns dict with 'allowed' boolean and 'remaining' count
        """
        limiter = get_rate_limiter()
        ip_address = get_client_ip(request)

        # Get comprehensive rate limit info
        info = limiter.get_rate_limit_info(
            key=ip_address,
            max_attempts=cls.RATE_LIMIT_MAX_ATTEMPTS,
            window_seconds=cls.RATE_LIMIT_WINDOW,
        )

        return {
            "allowed": info["allowed"],
            "remaining": info["remaining"],
            "reset_in": info["reset_in"],
            "message": (
                f"Rate limit exceeded. Try again in "
                f"{info['reset_in'] // 60 + 1} minutes."
                if not info["allowed"]
                else None
            ),
        }

    @classmethod
    def record_submission_attempt(
        cls,
        request: HttpRequest,
    ) -> None:
        """
        Record a submission attempt using database-backed rate limiter.
        """
        limiter = get_rate_limiter()
        ip_address = get_client_ip(request)

        # Record the attempt by checking rate limit (which increments counter)
        limiter.is_rate_limited(
            key=ip_address,
            max_attempts=cls.RATE_LIMIT_MAX_ATTEMPTS,
            window_seconds=cls.RATE_LIMIT_WINDOW,
        )

    @classmethod
    def validate_honeypot(cls, form_data: dict[str, Any]) -> bool:
        """
        Validate honeypot fields
        Returns True if validation passes (human), False if spam detected
        """
        # Check for honeypot fields that should be empty
        honeypot_fields = ["website", "url", "homepage", "confirm_email"]

        for field in honeypot_fields:
            if form_data.get(field):
                logger.warning(
                    f"Honeypot field '{field}' filled, potential spam detected",
                )
                return False

        return True

    @classmethod
    def validate_timing(cls, form_data: dict[str, Any]) -> bool:
        """
        Validate form submission timing
        Too fast = bot, too slow = potentially abandoned
        """
        form_start_time = form_data.get("form_start_time")
        if not form_start_time:
            # If no timing data, allow submission but log it
            logger.warning("No form timing data provided")
            return True

        try:
            start_time = datetime.fromisoformat(form_start_time)
            # Make timezone-aware if it's naive
            if start_time.tzinfo is None:
                start_time = timezone.make_aware(start_time)
            submission_time = timezone.now()
            time_taken = (submission_time - start_time).total_seconds()

            # Too fast (likely bot)
            if time_taken < 5:  # Less than 5 seconds
                logger.warning(f"Form submitted too quickly: {time_taken}s")
                return False

            # Too slow (likely abandoned/suspicious)
            if time_taken > 1800:  # More than 30 minutes
                logger.warning(f"Form submitted after long delay: {time_taken}s")
                return False

            return True

        except (ValueError, TypeError) as e:
            logger.warning(f"Invalid form timing data: {e}")
            return True  # Allow if timing data is invalid

    @classmethod
    def _validate_with_email_validator(cls, email: str) -> list[str]:
        """
        Validate email using email-validator library.
        Returns list of validation failure reasons.
        """
        reasons = []
        try:
            # Validate email with deliverability and domain checks
            validated_email = validate_email(
                email,
                check_deliverability=True,  # Check if domain has MX record
            )

            # Additional checks on the validated email
            normalized_email = validated_email.email.lower()

            # Check for test patterns in validated email
            if "test" in normalized_email and "+" in normalized_email:
                reasons.append("Test email pattern detected")

            # Check for sequential numbers (common in spam)
            if any(str(i) * 3 in normalized_email for i in range(10)):
                reasons.append("Sequential number pattern in email")

        except EmailNotValidError as e:
            # Email is invalid according to email-validator
            reasons.append(f"Invalid email address: {str(e)}")
            logger.info(f"Email validation failed for {email}: {e}")
        except Exception as e:
            # Network or other errors - log but don't block
            logger.warning(f"Email validation service error for {email}: {e}")
            # Fall through to basic checks

        return reasons

    @classmethod
    def _validate_with_basic_checks(cls, email: str) -> list[str]:
        """
        Perform basic email validation when email-validator is unavailable.
        Returns list of validation failure reasons.
        """
        reasons = []

        # Basic email format validation - must contain @ and have parts before/after
        if "@" not in email:
            reasons.append("Invalid email format: missing @ symbol")
        elif email.count("@") != 1:
            reasons.append("Invalid email format: multiple @ symbols")
        else:
            parts = email.split("@")
            if not parts[0] or not parts[1]:
                reasons.append("Invalid email format: missing local or domain part")
            else:
                domain = parts[1].lower()

                # Check domain against known disposable email providers
                if domain in cls.SUSPICIOUS_DOMAINS:
                    reasons.append(f"Disposable email domain: {domain}")

        return reasons

    @classmethod
    def _check_email_patterns(cls, email: str) -> list[str]:
        """
        Check email for suspicious patterns.
        Returns list of pattern detection reasons.
        """
        reasons = []
        email_lower = email.lower()

        # Basic pattern checks
        if "+" in email_lower and "test" in email_lower:
            reasons.append("Test email pattern detected")

        # Check for sequential numbers
        if any(str(i) * 3 in email_lower for i in range(10)):
            reasons.append("Sequential number pattern in email")

        return reasons

    @classmethod
    def check_email_reputation(cls, email: str) -> dict[str, Any]:
        """
        Check email address reputation using email-validator
        Falls back to basic checks if email-validator is unavailable
        Returns dict with 'suspicious' boolean and 'reasons' list
        """
        reasons = []

        # Use email-validator for comprehensive validation if available
        if validate_email is not None:
            reasons.extend(cls._validate_with_email_validator(email))

        # Fallback to basic domain checks if email-validator unavailable or failed
        if validate_email is None or not reasons:
            reasons.extend(cls._validate_with_basic_checks(email))

        # Always check for suspicious patterns
        reasons.extend(cls._check_email_patterns(email))

        return {
            "suspicious": len(reasons) > 0,
            "reasons": reasons,
        }

    @classmethod
    def check_content_quality(
        cls,
        stakeholder_data: dict[str, Any],
        statement: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """
        Check content quality for spam indicators using Akismet
        Falls back to custom checks if Akismet is unavailable
        Returns dict with 'suspicious' boolean and 'reasons' list
        """
        reasons = []

        # Try Akismet first if available and configured
        akismet_key = getattr(settings, "AKISMET_SECRET_API_KEY", None)
        site_url = getattr(settings, "SITE_URL", None)

        if akismet and akismet_key and site_url:
            try:
                api = akismet.Akismet(
                    key=akismet_key,
                    blog_url=site_url,
                )

                # Verify API key is valid
                if api.verify_key():
                    # Prepare comment data for Akismet
                    comment_data = {
                        "comment_type": "endorsement",
                        "comment_author": stakeholder_data.get("name", ""),
                        "comment_author_email": stakeholder_data.get("email", ""),
                        "comment_content": statement,
                        "user_ip": ip_address or "127.0.0.1",
                        "user_agent": user_agent or "Coalition Builder",
                        "blog_lang": "en",
                        "blog_charset": "UTF-8",
                    }

                    # Check with Akismet
                    is_spam = api.comment_check(**comment_data)
                    if is_spam:
                        reasons.append("Content flagged as spam by Akismet")
                        logger.info(
                            f"Akismet flagged content as spam from "
                            f"{stakeholder_data.get('email', 'unknown')}",
                        )
                else:
                    logger.warning("Akismet API key verification failed")
            except Exception as e:
                logger.warning(f"Akismet check failed: {e}")

        # Fallback to custom checks (always run as additional layer)
        # Keep basic quality checks
        name = stakeholder_data.get("name", "").lower()
        org = stakeholder_data.get("organization", "").lower()

        if "test" in name or "fake" in name:
            reasons.append("Suspicious name pattern")

        if "test" in org or "fake" in org or len(org) < 3:
            reasons.append("Suspicious organization name")

        # Check for excessive character repetition
        if statement and re.search(r"(.)\1{3,}", statement.lower()):
            reasons.append("Excessive character repetition in statement")

        # Check for missing required context
        if not statement and not stakeholder_data.get("role"):
            reasons.append("Minimal content provided")

        return {
            "suspicious": len(reasons) > 0,
            "reasons": reasons,
        }

    @classmethod
    def comprehensive_spam_check(
        cls,
        request: HttpRequest,
        stakeholder_data: dict[str, Any],
        statement: str,
        form_data: dict[str, Any],
        user_agent: str | None = None,
        skip_rate_limiting: bool = False,
    ) -> dict[str, Any]:
        """
        Run comprehensive spam check
        Returns dict with overall assessment and details
        """
        # Extract IP address from request with validation and spoofing protection
        ip_address = get_client_ip(request)

        results: dict[str, Any] = {
            "is_spam": False,
            "confidence_score": 0.0,  # 0.0 = definitely human, 1.0 = definitely spam
            "reasons": [],
            "rate_limit": None,
            "recommendations": [],
        }

        # Handle rate limiting if not skipped
        if not skip_rate_limiting:
            # Record this attempt for rate limiting first
            cls.record_submission_attempt(request)

            # Check rate limiting
            rate_limit_result = cls.check_rate_limit(request)
            results["rate_limit"] = rate_limit_result
            if not rate_limit_result["allowed"]:
                results["is_spam"] = True
                results["confidence_score"] = 1.0
                results["reasons"].append("Rate limit exceeded")
                return results

        # Check honeypot
        if not cls.validate_honeypot(form_data):
            results["is_spam"] = True
            results["confidence_score"] = 1.0
            results["reasons"].append("Honeypot field filled")
            return results

        # Check timing
        if not cls.validate_timing(form_data):
            results["confidence_score"] = float(results["confidence_score"]) + 0.5
            results["reasons"].append("Suspicious submission timing")

        # Check email reputation
        email_check = cls.check_email_reputation(stakeholder_data.get("email", ""))
        if email_check["suspicious"]:
            results["confidence_score"] = float(results["confidence_score"]) + 0.3
            results["reasons"].extend(email_check["reasons"])

        # Check content quality
        content_check = cls.check_content_quality(
            stakeholder_data,
            statement,
            ip_address,
            user_agent,
        )
        if content_check["suspicious"]:
            results["confidence_score"] = float(results["confidence_score"]) + 0.3
            results["reasons"].extend(content_check["reasons"])

        # Final determination
        if float(results["confidence_score"]) >= 0.7:
            results["is_spam"] = True
            results["recommendations"].append("Block submission")
        elif float(results["confidence_score"]) >= 0.4:
            results["recommendations"].append("Require additional verification")
        elif float(results["confidence_score"]) >= 0.2:
            results["recommendations"].append("Flag for manual review")
        else:
            results["recommendations"].append("Allow submission")

        return results
