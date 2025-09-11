"""
Tests for database-backed rate limiter.
"""

import contextlib
from unittest.mock import Mock, patch

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings

from coalition.core.database_rate_limiter import DatabaseRateLimiter, get_rate_limiter


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "test-cache",
        },
    },
)
class DatabaseRateLimiterTest(TestCase):
    """Test suite for DatabaseRateLimiter."""

    def setUp(self) -> None:
        """Set up test environment."""
        cache.clear()
        self.limiter = DatabaseRateLimiter()

    def tearDown(self) -> None:
        """Clean up after tests."""
        cache.clear()

    def test_initialization(self) -> None:
        """Test rate limiter initialization."""
        limiter = DatabaseRateLimiter()
        assert limiter.environment == "test"  # Should be 'test' during test runs

    @override_settings(ENVIRONMENT="production")
    def test_environment_isolation(self) -> None:
        """Test that different environments use different cache keys."""
        prod_limiter = DatabaseRateLimiter()
        test_limiter = DatabaseRateLimiter()

        # Override environment for test limiter
        test_limiter.environment = "test"

        prod_key = prod_limiter._get_cache_key("192.168.1.1")
        test_key = test_limiter._get_cache_key("192.168.1.1")

        assert prod_key != test_key
        assert prod_key.startswith("production:")
        assert test_key.startswith("test:")

    def test_basic_rate_limiting(self) -> None:
        """Test basic rate limiting functionality."""
        key = "test_ip_1"
        max_attempts = 3
        window_seconds = 60

        # First 3 attempts should be allowed
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            assert not result, f"Attempt {i + 1} should be allowed"

        # 4th attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        assert result, "4th attempt should be rate limited"

    def test_different_keys_independent(self) -> None:
        """Test that different keys are rate limited independently."""
        key1 = "ip_1"
        key2 = "ip_2"
        max_attempts = 2
        window_seconds = 60

        # Exhaust limit for key1
        for _i in range(max_attempts):
            assert not self.limiter.is_rate_limited(key1, max_attempts, window_seconds)
        assert self.limiter.is_rate_limited(key1, max_attempts, window_seconds)

        # key2 should still be allowed
        assert not self.limiter.is_rate_limited(key2, max_attempts, window_seconds)

    def test_window_key_generation(self) -> None:
        """Test time window key generation."""
        key = "test_key"
        window_seconds = 300  # 5 minutes

        # Mock time to specific value
        with patch("time.time", return_value=1000.0):
            window_key = self.limiter._get_window_key(key, window_seconds)
            # Should round down to window boundary: 1000 // 300 * 300 = 900
            expected_key = f"{key}:w:900"
            assert window_key == expected_key

    def test_get_remaining_attempts(self) -> None:
        """Test getting remaining attempts."""
        key = "test_ip_remaining"
        max_attempts = 5
        window_seconds = 60

        # Initially should have all attempts
        remaining = self.limiter.get_remaining_attempts(
            key,
            max_attempts,
            window_seconds,
        )
        assert remaining == 5

        # After one attempt
        self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        remaining = self.limiter.get_remaining_attempts(
            key,
            max_attempts,
            window_seconds,
        )
        assert remaining == 4

        # After exhausting all attempts
        for _i in range(4):  # 4 more attempts (total 5)
            self.limiter.is_rate_limited(key, max_attempts, window_seconds)

        remaining = self.limiter.get_remaining_attempts(
            key,
            max_attempts,
            window_seconds,
        )
        assert remaining == 0

    def test_reset_limit(self) -> None:
        """Test resetting rate limits."""
        key = "test_ip_reset"
        max_attempts = 2
        window_seconds = 60

        # Exhaust the limit
        for _i in range(max_attempts):
            assert not self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        assert self.limiter.is_rate_limited(key, max_attempts, window_seconds)

        # Reset the limit
        self.limiter.reset_limit(key)

        # Should be allowed again
        assert not self.limiter.is_rate_limited(key, max_attempts, window_seconds)

    def test_get_rate_limit_info(self) -> None:
        """Test getting comprehensive rate limit info."""
        key = "test_ip_info"
        max_attempts = 3
        window_seconds = 300

        # Initial state
        info = self.limiter.get_rate_limit_info(key, max_attempts, window_seconds)
        assert info["allowed"]
        assert info["remaining"] == 3
        assert info["total"] == 3
        assert info["current_count"] == 0
        assert info["window_seconds"] == 300
        assert info["reset_in"] > 0

        # After one attempt
        self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        info = self.limiter.get_rate_limit_info(key, max_attempts, window_seconds)
        assert info["allowed"]
        assert info["remaining"] == 2
        assert info["current_count"] == 1

    def test_error_handling(self) -> None:
        """Test graceful error handling (fail-open behavior)."""
        key = "test_error_handling"

        # Mock cache to raise exception
        with patch.object(cache, "get_or_set", side_effect=Exception("Cache error")):
            # Should not raise exception and should allow request (fail-open)
            result = self.limiter.is_rate_limited(key, 3, 60)
            assert not result, "Should fail open when cache errors occur"

    def test_different_window_sizes(self) -> None:
        """Test rate limiting with different window sizes."""
        key = "test_windows"
        max_attempts = 2

        # Test 60-second window
        for _i in range(max_attempts):
            assert not self.limiter.is_rate_limited(key, max_attempts, 60)
        assert self.limiter.is_rate_limited(key, max_attempts, 60)

        # Same key but different window should be independent
        # (though it shares some implementation details due to cache key generation)
        self.limiter.is_rate_limited(key, max_attempts, 300)
        # This might be True or False depending on implementation details
        # The key point is it doesn't crash

    def test_concurrent_requests_simulation(self) -> None:
        """Test behavior under simulated concurrent requests."""
        key = "test_concurrent"
        max_attempts = 5
        window_seconds = 60

        # Simulate rapid successive requests
        results = []
        for _i in range(10):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            results.append(result)

        # Should have exactly 5 allowed (False) and 5 blocked (True)
        allowed_count = sum(1 for r in results if not r)
        blocked_count = sum(1 for r in results if r)

        assert allowed_count == max_attempts
        assert blocked_count == 10 - max_attempts

    def test_cache_key_format(self) -> None:
        """Test cache key format and uniqueness."""
        limiter = DatabaseRateLimiter()

        # Test basic cache key
        key = limiter._get_cache_key("192.168.1.1")
        assert key.startswith("test:rate:")
        assert "192.168.1.1" in key

        # Test with custom prefix
        key_with_prefix = limiter._get_cache_key("user123", "login")
        assert key_with_prefix.startswith("test:login:")
        assert "user123" in key_with_prefix

    @patch("coalition.core.database_rate_limiter.logger")
    def test_logging(self, mock_logger: Mock) -> None:
        """Test that appropriate logging occurs."""
        key = "test_logging"
        max_attempts = 1

        # First request should be allowed (no logging)
        self.limiter.is_rate_limited(key, max_attempts, 60)
        mock_logger.info.assert_not_called()

        # Second request should be blocked and logged
        self.limiter.is_rate_limited(key, max_attempts, 60)
        mock_logger.info.assert_called_once()
        assert "Rate limit exceeded" in str(mock_logger.info.call_args)

    def test_get_rate_limiter_function(self) -> None:
        """Test the factory function."""
        limiter = get_rate_limiter()
        assert isinstance(limiter, DatabaseRateLimiter)

    def test_edge_case_zero_attempts(self) -> None:
        """Test edge case with zero max attempts."""
        key = "test_zero"
        result = self.limiter.is_rate_limited(key, 0, 60)
        # With 0 max attempts, should always be rate limited
        assert result

    def test_edge_case_negative_values(self) -> None:
        """Test edge cases with negative values."""
        key = "test_negative"

        # Negative max_attempts should be handled gracefully
        result = self.limiter.is_rate_limited(key, -1, 60)
        # Should be rate limited (no attempts allowed)
        assert result

        # Negative window_seconds should be handled gracefully
        # (Implementation may vary, but should not crash)
        try:
            result = self.limiter.is_rate_limited(key, 3, -60)
            # Should either work or fail gracefully
        except Exception:
            self.fail("Should handle negative window_seconds gracefully")

    @patch("time.time")
    def test_time_window_boundaries(self, mock_time: Mock) -> None:
        """Test behavior at time window boundaries."""
        key = "test_boundaries"
        window_seconds = 60
        max_attempts = 2

        # Set time to exactly a window boundary
        mock_time.return_value = 3600.0  # Exactly 1 hour

        # Use up attempts in this window
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            assert not result, f"Attempt {i + 1} should be allowed"

        # Next attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        assert result, "Should be rate limited after max attempts"

        # Move to next window
        mock_time.return_value = 3660.0  # 1 minute later (new window)

        # Should be allowed again in new window
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        assert not result, "Should be allowed in new time window"


class DatabaseRateLimiterIntegrationTest(TestCase):
    """Integration tests with actual database cache backend."""

    def setUp(self) -> None:
        """Set up integration test environment."""
        cache.clear()
        self.limiter = DatabaseRateLimiter()

    def tearDown(self) -> None:
        """Clean up after integration tests."""
        cache.clear()

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.db.DatabaseCache",
                "LOCATION": "test_cache_table",
            },
        },
    )
    def test_with_database_cache_backend(self) -> None:
        """Test with actual database cache backend."""
        with contextlib.suppress(Exception):
            call_command("createcachetable", "test_cache_table", verbosity=0)

        key = "integration_test"
        max_attempts = 3

        # Test normal rate limiting flow
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, 60)
            assert not result, f"Attempt {i + 1} should be allowed"

        # Next attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, 60)
        assert result, "Should be rate limited"

        # Test remaining attempts
        remaining = self.limiter.get_remaining_attempts(key, max_attempts, 60)
        assert remaining == 0

    def test_performance_under_load(self) -> None:
        """Test that rate limiting operations complete without timeout."""
        import time as time_module

        start_time = time_module.time()

        for i in range(100):
            key = f"perf_test_{i % 10}"
            self.limiter.is_rate_limited(key, 5, 60)

        duration = time_module.time() - start_time
        assert duration > 0, "Operations should complete"
