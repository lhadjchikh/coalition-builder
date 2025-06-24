"""
Security tests for form_metadata validation.

Tests the new SpamPreventionMetadata schema validation for security vulnerabilities.
"""

import json

from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign


class FormMetadataSecurityTests(TestCase):
    """Test security validations for form_metadata field."""

    def setUp(self) -> None:
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
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "state": "MD",
                "type": "individual",
            },
            "form_metadata": {
                "form_start_time": "2023-01-01T12:00:00",
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
                "referrer": "https://example.com<script>alert('xss')</script>",
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

    def test_oversized_referrer_truncation(self) -> None:
        """Test that oversized referrer fields are truncated."""
        long_referrer = "https://example.com/" + "x" * 600  # Over 500 char limit

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
                "form_start_time": "2023-01-01T12:00:00",
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

        # Should process successfully but truncate the referrer
        assert response.status_code == 200

    def test_valid_form_metadata_acceptance(self) -> None:
        """Test that valid form metadata is accepted."""
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
                "form_start_time": "2023-01-01T12:00:00",
                "website": "",
                "url": "",
                "homepage": "",
                "confirm_email": "",
                "referrer": "https://example.com",
            },
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(base_data),
            content_type="application/json",
        )

        # Should process successfully
        assert response.status_code == 200
