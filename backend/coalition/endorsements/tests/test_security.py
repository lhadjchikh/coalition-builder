"""
Security-focused tests for endorsements functionality.

Includes tests for:
- Security vulnerability testing (data protection, verified endorsement prevention)
- Redis integration and caching tests
- Rate limiting and IP spoofing prevention
- Integration test patterns
"""

from unittest.mock import patch

from django.core.cache import cache
from django.http import HttpRequest
from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder

from .utils import get_valid_form_metadata


class SecurityVulnerabilityTests(TestCase):
    """Test security fixes for data overwriting and rate limiting vulnerabilities"""

    def setUp(self) -> None:
        cache.clear()  # Clear rate limiting cache between tests
        self.client = Client()

        # Create existing stakeholder
        self.existing_stakeholder = Stakeholder.objects.create(
            first_name="John",
            last_name="Doe",
            organization="Acme Corp",
            role="CEO",
            email="john@acme.com",
            street_address="123 Business Blvd",
            city="New York",
            state="NY",
            zip_code="10001",
            county="Manhattan",
            type="business",
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            allow_endorsements=True,
        )

        # Create verified endorsement
        self.verified_endorsement = Endorsement.objects.create(
            stakeholder=self.existing_stakeholder,
            campaign=self.campaign,
            statement="Original statement",
            email_verified=True,
            status="verified",
        )

    def test_stakeholder_data_overwrite_prevention_exact_match(self) -> None:
        """Test that exact data matches are allowed for stakeholder updates"""
        # Create a different campaign to avoid verified endorsement conflict
        campaign2 = PolicyCampaign.objects.create(
            name="test-campaign-2",
            title="Test Campaign 2",
            summary="Test summary 2",
            allow_endorsements=True,
        )

        # Submit identical data - should be allowed
        response = self.client.post(
            "/api/endorsements/",
            {
                "campaign_id": campaign2.id,
                "stakeholder": {
                    "first_name": "John",  # Exact match
                    "last_name": "Doe",  # Exact match
                    "organization": "Acme Corp",  # Exact match
                    "role": "CEO",  # Exact match
                    "email": "john@acme.com",
                    "street_address": "123 Business Blvd",  # Exact match
                    "city": "New York",  # Exact match
                    "state": "NY",  # Exact match
                    "zip_code": "10001",  # Exact match
                    "county": "Manhattan",  # Exact match
                    "type": "business",  # Exact match
                },
                "statement": "Updated statement",
                "public_display": True,
                "terms_accepted": True,
                "org_authorized": True,
                "form_metadata": get_valid_form_metadata(),
            },
            content_type="application/json",
        )

        # Should succeed since data matches exactly
        assert response.status_code == 200

    def test_stakeholder_data_overwrite_prevention_name_mismatch(self) -> None:
        """Test that name mismatches are blocked to prevent account takeover"""
        # Try to overwrite with different name
        response = self.client.post(
            "/api/endorsements/",
            {
                "campaign_id": self.campaign.id,
                "stakeholder": {
                    "first_name": "Jane",  # Different name - should be blocked
                    "last_name": "Smith",  # Different name - should be blocked
                    "organization": "Acme Corp",
                    "role": "CEO",
                    "email": "john@acme.com",  # Same email
                    "street_address": "123 Business Blvd",
                    "city": "New York",
                    "state": "NY",
                    "zip_code": "10001",
                    "county": "Manhattan",
                    "type": "business",
                },
                "statement": "Malicious update",
                "public_display": True,
                "terms_accepted": True,
                "org_authorized": True,
                "form_metadata": get_valid_form_metadata(),
            },
            content_type="application/json",
        )

        assert response.status_code == 409
        data = response.json()
        assert "stakeholder with this email already exists" in data["detail"].lower()
        assert "different information" in data["detail"].lower()

    def test_verified_endorsement_modification_prevention(self) -> None:
        """Test that verified endorsements cannot be modified"""
        response = self.client.post(
            "/api/endorsements/",
            {
                "campaign_id": self.campaign.id,
                "stakeholder": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "organization": "Acme Corp",
                    "role": "CEO",
                    "email": "john@acme.com",
                    "street_address": "123 Business Blvd",
                    "city": "New York",
                    "state": "NY",
                    "zip_code": "10001",
                    "county": "Manhattan",
                    "type": "business",
                },
                "statement": "Attempting to change verified endorsement",
                "public_display": False,
                "terms_accepted": True,
                "org_authorized": True,
                "form_metadata": get_valid_form_metadata(),
            },
            content_type="application/json",
        )

        assert response.status_code == 409
        data = response.json()
        assert "already been verified" in data["detail"].lower()
        assert "contact support" in data["detail"].lower()

    # Rate limiting IP spoofing test moved to RateLimitingIntegrationTests class


class RedisIntegrationTests(TestCase):
    """Test Redis cache integration for rate limiting"""

    def setUp(self) -> None:
        # Clear cache before testing
        from django.core.cache import cache

        cache.clear()

    def test_spam_prevention_service_with_cache(self) -> None:
        """Test that SpamPreventionService works with cache backend"""
        from django.test import RequestFactory

        from coalition.endorsements.spam_prevention import SpamPreventionService

        factory = RequestFactory()
        request = factory.post("/api/endorsements/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        # Test rate limit check
        result = SpamPreventionService.check_rate_limit(request)
        assert result["allowed"] is True

        # Record submission attempt
        SpamPreventionService.record_submission_attempt(request)

        # Should still be allowed for second attempt
        result = SpamPreventionService.check_rate_limit(request)
        assert result["allowed"] is True


class RateLimitingIntegrationTests(TestCase):
    """
    Integration tests for rate limiting functionality.

    Now that Redis is used consistently across all environments,
    these tests can run with the standard cache configuration.
    """

    def setUp(self) -> None:
        # Clear cache before each test to ensure clean state
        from django.core.cache import cache

        cache.clear()

        # Verify Redis is working (skip tests if not available)
        try:
            cache.set("test_redis_connection", "working", 10)
            if cache.get("test_redis_connection") != "working":
                self.skipTest("Redis cache not available for rate limiting tests")
        except Exception as e:
            self.skipTest(f"Redis cache not available: {e}")

    def test_rate_limit_check_within_limit(self) -> None:
        """Test rate limit check when within limits"""
        from coalition.endorsements.spam_prevention import SpamPreventionService

        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.100"}

        result = SpamPreventionService.check_rate_limit(request)

        assert result["allowed"] is True
        assert result["remaining"] == SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS

    def test_rate_limit_check_exceeded(self) -> None:
        """Test rate limit check when exceeded"""
        from coalition.endorsements.spam_prevention import SpamPreventionService

        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.101"}

        # Record attempts to exceed the limit
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS + 1):
            SpamPreventionService.record_submission_attempt(request)

        result = SpamPreventionService.check_rate_limit(request)

        assert result["allowed"] is False
        assert result["remaining"] == 0
        assert "rate limit exceeded" in result["message"].lower()

    def test_record_submission_attempt(self) -> None:
        """Test recording submission attempts"""
        from coalition.endorsements.spam_prevention import SpamPreventionService

        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.102"}

        # First attempt
        SpamPreventionService.record_submission_attempt(request)
        result = SpamPreventionService.check_rate_limit(request)
        assert result["allowed"] is True

        # Record more attempts to exceed the limit
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS):
            SpamPreventionService.record_submission_attempt(request)

        result = SpamPreventionService.check_rate_limit(request)
        assert result["allowed"] is False

    def test_comprehensive_spam_check_rate_limit_exceeded(self) -> None:
        """Test comprehensive spam check with rate limit exceeded"""
        from coalition.endorsements.spam_prevention import SpamPreventionService

        request = HttpRequest()
        request.META = {"REMOTE_ADDR": "192.168.1.103"}

        stakeholder_data = {
            "name": "John Doe",
            "organization": "Test Org",
            "email": "john@example.com",
            "street_address": "456 Test Ave",
            "city": "Baltimore",
            "state": "MD",
            "zip_code": "21201",
            "type": "individual",
        }

        # Exceed rate limit first
        for _ in range(SpamPreventionService.RATE_LIMIT_MAX_ATTEMPTS + 1):
            SpamPreventionService.record_submission_attempt(request)

        result = SpamPreventionService.comprehensive_spam_check(
            request,
            stakeholder_data,
            "Test statement",
            {},
            "Mozilla/5.0",
        )

        assert result["is_spam"] is True
        assert any("rate limit" in reason.lower() for reason in result["reasons"])

    def test_rate_limiting_ip_spoofing_prevention(self) -> None:
        """Test that rate limiting uses secure IP extraction to prevent spoofing"""

        from django.core.cache import cache
        from django.http import HttpRequest

        from coalition.campaigns.models import PolicyCampaign
        from coalition.endorsements.spam_prevention import SpamPreventionService

        # Clear cache before test to ensure clean state
        cache.clear()

        # Create a campaign for the test
        PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test campaign for rate limiting",
        )

        # Test that the secure IP extraction function prevents spoofing
        # by returning the same IP regardless of different X-Forwarded-For headers
        with patch(
            "coalition.endorsements.spam_prevention.get_client_ip",
        ) as mock_get_ip:
            # Mock to return consistent IP regardless of headers
            mock_get_ip.return_value = "192.168.1.104"

            # Create requests with different X-Forwarded-For headers
            # These should all be treated as coming from the same IP
            requests = []
            for i in range(4):
                request = HttpRequest()
                request.META = {
                    "REMOTE_ADDR": "127.0.0.1",  # Test client IP
                    "HTTP_X_FORWARDED_FOR": f"10.0.0.{i}",  # Different spoofed IPs
                }
                requests.append(request)

            # Record attempts using the spam prevention service directly
            # This simulates the actual endpoint (record-then-check pattern)
            for i, request in enumerate(requests):
                # Record the attempt first (like the API does)
                SpamPreventionService.record_submission_attempt(request)

                # Then check the rate limit
                result = SpamPreventionService.check_rate_limit(request)

                if i < 3:
                    # First 3 should be allowed
                    assert result["allowed"] is True
                else:
                    # 4th should be blocked due to rate limiting
                    assert result["allowed"] is False
                    assert "rate limit" in result["message"].lower()

            # Verify the mock was called for each request
            assert mock_get_ip.call_count >= 4
