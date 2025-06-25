"""
Security tests for form_metadata validation.

Tests the new SpamPreventionMetadata schema validation for security vulnerabilities.
"""

import json
from datetime import timedelta
from unittest.mock import Mock, patch

from django.test import Client, TestCase
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign


# Mock rate limiting during these tests to focus on form metadata validation
# Rate limiting functionality is tested separately in other test files
@patch(
    "coalition.endorsements.spam_prevention.SpamPreventionService.record_submission_attempt",
)
@patch(
    "coalition.endorsements.spam_prevention.SpamPreventionService.check_rate_limit",
    return_value={"allowed": True},
)
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

    def test_honeypot_field_validation(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test that honeypot fields must be empty."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
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

    def test_form_timing_validation(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test form timing field validation."""
        # Test with oversized timing data
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
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

    def test_invalid_datetime_format(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test invalid datetime format rejection."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Test User",
                "organization": "Test Org",
                "email": "test@example.com",
                "street_address": "123 Test St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
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

    def test_referrer_sanitization(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test referrer field sanitization."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Sarah Johnson",
                "organization": "Johnson Consulting",
                "email": "sarah@johnsonconsulting.com",
                "street_address": "456 Consulting Way",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21202",
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
        
        # Debug output for CI
        if response.status_code != 200:
            print(f"DEBUG: Response status: {response.status_code}")
            print(f"DEBUG: Response content: {response.content.decode()}")
            try:
                response_json = response.json()
                print(f"DEBUG: Response JSON: {response_json}")
            except:
                pass
        
        assert response.status_code == 200

    def test_oversized_referrer_validation(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test that oversized referrer fields are rejected by validation."""
        long_referrer = "https://greenfarms.org/" + "x" * 600  # Over 500 char limit

        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "Michael Brown",
                "organization": "Green Farms Coalition",
                "email": "michael@greenfarms.org",
                "street_address": "789 Green Street",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21203",
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

    def test_valid_form_metadata_acceptance(
        self,
        mock_check_rate_limit: Mock,  # noqa: ARG002
        mock_record_attempt: Mock,  # noqa: ARG002
    ) -> None:
        """Test that valid form metadata is accepted."""
        base_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "name": "John Smith",
                "organization": "Smith Industries",
                "email": "john.smith@smithindustries.com",
                "street_address": "123 Business Blvd",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
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
        
        # Debug output for CI
        if response.status_code != 200:
            print(f"DEBUG: Response status: {response.status_code}")
            print(f"DEBUG: Response content: {response.content.decode()}")
            try:
                response_json = response.json()
                print(f"DEBUG: Response JSON: {response_json}")
            except:
                pass
        
        assert response.status_code == 200
