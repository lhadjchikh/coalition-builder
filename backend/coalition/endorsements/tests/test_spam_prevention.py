"""
Tests for spam prevention service and IP validation.
"""

from datetime import timedelta

from django.http import HttpRequest
from django.test import TestCase
from django.utils import timezone

from ..spam_prevention import SpamPreventionService, get_client_ip
from .utils import TEST_PRIVATE_IP, TEST_PUBLIC_IP


class SpamPreventionServiceTest(TestCase):
    """Test spam prevention service"""

    def setUp(self) -> None:
        # Create a mock request for testing
        self.request = HttpRequest()
        self.request.META = {
            "REMOTE_ADDR": "192.168.1.1",
            "HTTP_USER_AGENT": "Test User Agent",
        }

    def test_validate_honeypot_empty_fields(self) -> None:
        """Test honeypot validation with empty fields (valid)"""
        form_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "message": "Valid submission",
        }
        assert SpamPreventionService.validate_honeypot(form_data) is True

    def test_validate_honeypot_filled_fields(self) -> None:
        """Test honeypot validation with filled honeypot fields (spam)"""
        form_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "website": "http://spam.com",  # Honeypot field
            "message": "Spam submission",
        }
        assert SpamPreventionService.validate_honeypot(form_data) is False

    def test_validate_timing_no_timing_data(self) -> None:
        """Test timing validation with missing timing data"""
        form_data = {"message": "Test"}
        assert SpamPreventionService.validate_timing(form_data) is True

    def test_validate_timing_too_fast(self) -> None:
        """Test timing validation for too-fast submission"""
        start_time = (timezone.now() - timedelta(seconds=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is False

    def test_validate_timing_too_slow(self) -> None:
        """Test timing validation for too-slow submission"""
        start_time = (timezone.now() - timedelta(hours=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is False

    def test_validate_timing_normal(self) -> None:
        """Test timing validation for normal submission time"""
        start_time = (timezone.now() - timedelta(minutes=2)).isoformat()
        form_data = {"form_start_time": start_time}
        assert SpamPreventionService.validate_timing(form_data) is True

    def test_check_email_reputation_disposable_domain(self) -> None:
        """Test email reputation check for disposable domains"""
        result = SpamPreventionService.check_email_reputation("test@mailinator.com")
        assert result["suspicious"] is True
        # Should detect either as disposable domain or invalid
        assert len(result["reasons"]) > 0

    def test_check_email_reputation_test_pattern(self) -> None:
        """Test email reputation check for test patterns"""
        result = SpamPreventionService.check_email_reputation("user+test@gmail.com")
        # Should be flagged for test pattern (contains both "test" and "+")
        assert result["suspicious"] is True
        assert any("test" in reason.lower() for reason in result["reasons"])

    def test_check_email_reputation_sequential_numbers(self) -> None:
        """Test email reputation check for sequential numbers"""
        result = SpamPreventionService.check_email_reputation("user000@gmail.com")
        # This should be flagged as it contains "000" (3 consecutive zeros)
        assert result["suspicious"] is True
        assert any("sequential" in reason.lower() for reason in result["reasons"])

    def test_check_email_reputation_clean_email(self) -> None:
        """Test email reputation check for clean email"""
        result = SpamPreventionService.check_email_reputation("john.doe@gmail.com")
        assert result["suspicious"] is False
        assert len(result["reasons"]) == 0

    def test_check_email_reputation_invalid_email(self) -> None:
        """Test email reputation check for invalid email format"""
        result = SpamPreventionService.check_email_reputation("invalid-email")
        assert result["suspicious"] is True
        # Should detect invalid format with email-validator or basic checks
        assert len(result["reasons"]) > 0

    def test_check_content_quality_without_akismet(self) -> None:
        """Test content quality check without Akismet (fallback mode)"""
        stakeholder_data = {"name": "test user", "organization": "fake org"}
        statement = "This statement has excessive character repetitionnnnnn!"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        # Should catch both name pattern and character repetition
        assert len(result["reasons"]) >= 2

    def test_check_content_quality_character_repetition(self) -> None:
        """Test content quality check for character repetition"""
        stakeholder_data = {"name": "John Doe", "organization": "Acme Corp"}
        statement = "This is sooooo important!"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        assert any("repetition" in reason.lower() for reason in result["reasons"])

    def test_check_content_quality_suspicious_name(self) -> None:
        """Test content quality check for suspicious name patterns"""
        stakeholder_data = {"name": "Test User", "organization": "Real Company"}
        statement = "I support this campaign"

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is True
        assert any("suspicious name" in reason.lower() for reason in result["reasons"])

    def test_check_content_quality_clean_content(self) -> None:
        """Test content quality check for clean content"""
        stakeholder_data = {
            "name": "Jane Smith",
            "organization": "Green Energy Corp",
            "role": "Director",
        }
        statement = "We fully support this important environmental initiative."

        result = SpamPreventionService.check_content_quality(
            stakeholder_data,
            statement,
            "192.168.1.1",
            "Test User Agent",
        )
        assert result["suspicious"] is False
        assert len(result["reasons"]) == 0

    def test_comprehensive_spam_check_clean_submission(self) -> None:
        """Test comprehensive spam check for clean submission"""
        stakeholder_data = {
            "name": "Sarah Johnson",
            "organization": "Environmental Solutions Inc",
            "email": "sarah@envsolutions.com",
            "role": "CEO",
        }
        statement = "Our organization strongly supports this environmental policy."
        form_data = {
            "form_start_time": (timezone.now() - timedelta(minutes=3)).isoformat(),
        }

        result = SpamPreventionService.comprehensive_spam_check(
            self.request,
            stakeholder_data,
            statement,
            form_data,
        )

        assert result["is_spam"] is False
        assert result["confidence_score"] < 0.2
        assert "allow submission" in result["recommendations"][0].lower()

    def test_comprehensive_spam_check_honeypot_filled(self) -> None:
        """Test comprehensive spam check with honeypot field filled"""
        stakeholder_data = {
            "name": "Spam User",
            "organization": "Spam Corp",
            "email": "spam@example.com",
        }
        statement = "Spam message"
        form_data = {
            "website": "http://spam.com",  # Honeypot field
        }

        result = SpamPreventionService.comprehensive_spam_check(
            self.request,
            stakeholder_data,
            statement,
            form_data,
        )

        assert result["is_spam"] is True
        assert result["confidence_score"] == 1.0
        assert "honeypot" in result["reasons"][0].lower()


class IPValidationTest(TestCase):
    """Test secure IP address extraction and validation"""

    def test_get_client_ip_direct_connection(self) -> None:
        """Test IP extraction for direct internet connections"""
        request = HttpRequest()
        request.META = {"REMOTE_ADDR": TEST_PUBLIC_IP}  # Public IP

        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

    def test_get_client_ip_ignores_spoofed_headers_from_internet(self) -> None:
        """Test that spoofed headers are ignored for direct internet connections"""
        request = HttpRequest()
        request.META = {
            "REMOTE_ADDR": TEST_PUBLIC_IP,  # Public IP (direct connection)
            "HTTP_X_FORWARDED_FOR": "192.168.1.100",  # Spoofed private IP
        }

        # Should ignore X-Forwarded-For and use REMOTE_ADDR
        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

    def test_get_client_ip_trusts_proxy_from_private_ip(self) -> None:
        """Test that proxy headers are trusted when connection is from private IP"""
        request = HttpRequest()
        request.META = {
            "REMOTE_ADDR": TEST_PRIVATE_IP,  # Private IP (load balancer)
            "HTTP_X_FORWARDED_FOR": f"{TEST_PUBLIC_IP}, {TEST_PRIVATE_IP}",
        }

        # Should trust X-Forwarded-For from private IP connection
        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

    def test_get_client_ip_handles_invalid_ips(self) -> None:
        """Test handling of invalid IP addresses"""
        request = HttpRequest()
        request.META = {
            "REMOTE_ADDR": "invalid.ip.address",
            "HTTP_X_FORWARDED_FOR": "not.an.ip, also.invalid",
        }

        # Should fallback to localhost for invalid IPs
        ip = get_client_ip(request)
        assert ip == "127.0.0.1"

    def test_get_client_ip_multiple_proxies(self) -> None:
        """Test IP extraction through multiple proxy layers"""
        request = HttpRequest()
        request.META = {
            "REMOTE_ADDR": "172.16.0.1",  # Private IP (reverse proxy)
            "HTTP_X_FORWARDED_FOR": f"{TEST_PUBLIC_IP}, {TEST_PRIVATE_IP}, 172.16.0.1",
        }

        # Should find the first public IP in the chain
        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

    def test_get_client_ip_no_forwarded_header(self) -> None:
        """Test IP extraction when no X-Forwarded-For header is present"""
        request = HttpRequest()
        request.META = {"REMOTE_ADDR": TEST_PUBLIC_IP}

        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

    def test_get_client_ip_prevents_rate_limit_bypass(self) -> None:
        """Test that IP validation prevents rate limit bypass attempts"""
        # Simulate attacker trying to bypass rate limits with fake IPs
        request = HttpRequest()
        request.META = {
            "REMOTE_ADDR": TEST_PUBLIC_IP,  # Real public IP
            "HTTP_X_FORWARDED_FOR": "1.2.3.4",  # Fake IP to bypass rate limits
        }

        # Should ignore the fake header and use real IP
        ip = get_client_ip(request)
        assert ip == TEST_PUBLIC_IP

        # The IP should be consistent across multiple calls
        ip2 = get_client_ip(request)
        assert ip == ip2
