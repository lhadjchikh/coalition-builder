"""
Shared test utilities for endorsements tests.
"""

from datetime import timedelta

from django.utils import timezone

# Test constants
TEST_PUBLIC_IP = "8.8.8.8"  # Google DNS - a reliable public IP for testing
TEST_PRIVATE_IP = "10.0.0.5"  # Private IP for simulating load balancers/proxies


def get_valid_form_metadata() -> dict:
    """
    Helper function to generate valid form metadata for tests.

    Returns structured metadata that passes SpamPreventionMetadata validation.
    """
    return {
        "form_start_time": (
            timezone.now() - timedelta(minutes=2)
        ).isoformat(),  # Recent timestamp
        "website": "",  # honeypot field (should be empty)
        "url": "",  # honeypot field (should be empty)
        "homepage": "",  # honeypot field (should be empty)
        "confirm_email": "",  # honeypot field (should be empty)
        "referrer": "",  # optional referrer field
    }
