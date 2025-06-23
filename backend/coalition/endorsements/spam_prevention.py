"""
Spam prevention utilities for endorsement forms
"""

import logging
import re
from datetime import datetime
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

try:
    import akismet
except ImportError:
    akismet = None

logger = logging.getLogger(__name__)


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

    # Suspicious patterns
    SUSPICIOUS_DOMAINS = [
        "mailinator.com",
        "10minutemail.com",
        "guerrillamail.com",
        "temp-mail.org",
        "throwaway.email",
    ]

    @classmethod
    def check_rate_limit(cls, ip_address: str) -> dict[str, Any]:
        """
        Check if IP address has exceeded rate limit
        Returns dict with 'allowed' boolean and 'remaining' count
        """
        cache_key = f"endorsement_rate_limit:{ip_address}"

        # Get current attempt count
        current_attempts = cache.get(cache_key, 0)

        if current_attempts >= cls.RATE_LIMIT_MAX_ATTEMPTS:
            return {
                "allowed": False,
                "remaining": 0,
                "reset_in": cls.RATE_LIMIT_WINDOW,
                "message": (
                    f"Rate limit exceeded. Try again in "
                    f"{cls.RATE_LIMIT_WINDOW // 60} minutes."
                ),
            }

        return {
            "allowed": True,
            "remaining": cls.RATE_LIMIT_MAX_ATTEMPTS - current_attempts,
            "reset_in": cls.RATE_LIMIT_WINDOW,
        }

    @classmethod
    def record_submission_attempt(cls, ip_address: str) -> None:
        """Record a submission attempt from an IP address"""
        cache_key = f"endorsement_rate_limit:{ip_address}"

        # Increment attempt count
        current_attempts = cache.get(cache_key, 0)
        cache.set(cache_key, current_attempts + 1, cls.RATE_LIMIT_WINDOW)

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
    def check_email_reputation(cls, email: str) -> dict[str, Any]:
        """
        Check email address reputation
        Returns dict with 'suspicious' boolean and 'reasons' list
        """
        reasons = []

        # Check domain against known disposable email providers
        domain = email.split("@")[-1].lower()
        if domain in cls.SUSPICIOUS_DOMAINS:
            reasons.append(f"Disposable email domain: {domain}")

        # Check for suspicious patterns in email
        email_lower = email.lower()
        if "+" in email_lower and "test" in email_lower:
            reasons.append("Test email pattern detected")

        # Check for sequential numbers (common in spam)
        if any(str(i) * 3 in email_lower for i in range(10)):  # 000, 111, 222, etc.
            reasons.append("Sequential number pattern in email")

        return {
            "suspicious": len(reasons) > 0,
            "reasons": reasons,
        }

    @classmethod
    def check_content_quality(
        cls,
        stakeholder_data: dict[str, Any],
        statement: str,
        ip_address: str = None,
        user_agent: str = None,
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
        if re.search(r"(.)\1{3,}", statement.lower()):
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
        ip_address: str,
        stakeholder_data: dict[str, Any],
        statement: str,
        form_data: dict[str, Any],
        user_agent: str = None,
    ) -> dict[str, Any]:
        """
        Run comprehensive spam check
        Returns dict with overall assessment and details
        """
        results = {
            "is_spam": False,
            "confidence_score": 0.0,  # 0.0 = definitely human, 1.0 = definitely spam
            "reasons": [],
            "rate_limit": None,
            "recommendations": [],
        }

        # Check rate limiting
        rate_limit_result = cls.check_rate_limit(ip_address)
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
            results["confidence_score"] += 0.5
            results["reasons"].append("Suspicious submission timing")

        # Check email reputation
        email_check = cls.check_email_reputation(stakeholder_data.get("email", ""))
        if email_check["suspicious"]:
            results["confidence_score"] += 0.3
            results["reasons"].extend(email_check["reasons"])

        # Check content quality
        content_check = cls.check_content_quality(
            stakeholder_data,
            statement,
            ip_address,
            user_agent,
        )
        if content_check["suspicious"]:
            results["confidence_score"] += 0.3
            results["reasons"].extend(content_check["reasons"])

        # Final determination
        if results["confidence_score"] >= 0.7:
            results["is_spam"] = True
            results["recommendations"].append("Block submission")
        elif results["confidence_score"] >= 0.4:
            results["recommendations"].append("Require additional verification")
        elif results["confidence_score"] >= 0.2:
            results["recommendations"].append("Flag for manual review")
        else:
            results["recommendations"].append("Allow submission")

        return results
