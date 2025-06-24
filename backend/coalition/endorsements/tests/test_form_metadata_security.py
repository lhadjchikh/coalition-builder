"""
Security tests for form_metadata validation.

Tests the new SpamPreventionMetadata schema validation for security vulnerabilities.
"""

import json
from datetime import timedelta

from django.core.cache import cache
from django.test import Client, TestCase
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign


class FormMetadataSecurityTests(TestCase):
    """Test security validations for form_metadata field."""

    def setUp(self) -> None:
        cache.clear()  # Clear rate limiting cache between tests

        self.client = Client()
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Security Campaign",
            summary="Testing form metadata security",
            allow_endorsements=True,
        )

    def test_honeypot_field_validation(self) -> None:
        """Test that honeypot fields must be empty."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "MD",
                "type": "individual",
            },
            "statement": "Test statement",
            "form_metadata": {
                "form_start_time": "2023-01-01T12:00:00",
                "website": "malicious-bot-fill",  # Should be empty
                "url": "",
                "homepage": "",
                "confirm_email": "",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should be rejected due to honeypot validation
        assert response.status_code == 422  # ValidationError

    def test_form_timing_validation(self) -> None:
        """Test form timing field validation."""
        # Test with oversized timing data
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "MD",
                "type": "individual",
            },
            "form_metadata": {
                "form_start_time": "x" * 100,  # Too long (>50 chars)
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should be rejected due to size validation
        assert response.status_code == 422  # ValidationError

    def test_invalid_datetime_format(self) -> None:
        """Test invalid datetime format rejection."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "MD",
                "type": "individual",
            },
            "form_metadata": {
                "form_start_time": "not-a-datetime",
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should be rejected due to datetime validation
        assert response.status_code == 422  # ValidationError

    def test_referrer_sanitization(self) -> None:
        """Test referrer field sanitization."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Sarah Johnson",
                "organization": "Johnson Consulting",
                "email": "sarah@johnsonconsulting.com",
                "state": "MD",
                "type": "business",
            },
            "statement": "This initiative aligns with our company values and goals.",
            "form_metadata": {
                "form_start_time": (timezone.now() - timedelta(minutes=2)).isoformat(),
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
                "referrer": "https://johnsonconsulting.com<script>alert('xss')</script>",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should process successfully but sanitize dangerous content
        # The referrer field should have dangerous characters removed
        assert response.status_code == 200

    def test_oversized_referrer_validation(self) -> None:
        """Test that oversized referrer fields are rejected by validation."""
        long_referrer = "https://greenfarms.org/" + "x" * 600  # Over 500 char limit

        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Michael Brown",
                "organization": "Green Farms Coalition",
                "email": "michael@greenfarms.org",
                "state": "MD",
                "type": "nonprofit",
            },
            "statement": (
                "Our organization fully supports this environmental initiative."
            ),
            "form_metadata": {
                "form_start_time": (timezone.now() - timedelta(minutes=2)).isoformat(),
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
                "referrer": long_referrer,
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should be rejected due to size validation (not truncated)
        assert response.status_code == 422  # ValidationError
        data = response.json()
        assert "referrer" in str(data)
        assert "too long" in str(data) or "max" in str(data)

    def test_valid_form_metadata_acceptance(self) -> None:
        """Test that valid form metadata is accepted."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "John Smith",
                "organization": "Smith Industries",
                "email": "john.smith@smithindustries.com",
                "state": "MD",
                "type": "business",
            },
            "statement": (
                "I strongly support this important initiative for our community."
            ),
            "form_metadata": {
                "form_start_time": (timezone.now() - timedelta(minutes=2)).isoformat(),
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
                "referrer": "https://smithindustries.com",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should process successfully
        assert response.status_code == 200
