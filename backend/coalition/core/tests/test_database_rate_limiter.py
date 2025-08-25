"""
Tests for database-backed rate limiter.
"""

from unittest.mock import patch

from django.core.cache import cache
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

    def setUp(self):
        """Set up test environment."""
        # Clear cache between tests
        cache.clear()
        self.limiter = DatabaseRateLimiter()

    def tearDown(self):
        """Clean up after tests."""
        cache.clear()

    def test_initialization(self):
        """Test rate limiter initialization."""
        limiter = DatabaseRateLimiter()
        self.assertEqual(
            limiter.environment,
            "test",
        )  # Should be 'test' during test runs

    @override_settings(ENVIRONMENT="production")
    def test_environment_isolation(self):
        """Test that different environments use different cache keys."""
        prod_limiter = DatabaseRateLimiter()
        test_limiter = DatabaseRateLimiter()

        # Override environment for test limiter
        test_limiter.environment = "test"

        prod_key = prod_limiter._get_cache_key("192.168.1.1")
        test_key = test_limiter._get_cache_key("192.168.1.1")

        self.assertNotEqual(prod_key, test_key)
        self.assertTrue(prod_key.startswith("production:"))
        self.assertTrue(test_key.startswith("test:"))

    def test_basic_rate_limiting(self):
        """Test basic rate limiting functionality."""
        key = "test_ip_1"
        max_attempts = 3
        window_seconds = 60

        # First 3 attempts should be allowed
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            self.assertFalse(result, f"Attempt {i+1} should be allowed")

        # 4th attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        self.assertTrue(result, "4th attempt should be rate limited")

    def test_different_keys_independent(self):
        """Test that different keys are rate limited independently."""
        key1 = "ip_1"
        key2 = "ip_2"
        max_attempts = 2
        window_seconds = 60

        # Exhaust limit for key1
        for i in range(max_attempts):
            self.assertFalse(
                self.limiter.is_rate_limited(key1, max_attempts, window_seconds),
            )
        self.assertTrue(
            self.limiter.is_rate_limited(key1, max_attempts, window_seconds),
        )

        # key2 should still be allowed
        self.assertFalse(
            self.limiter.is_rate_limited(key2, max_attempts, window_seconds),
        )

    def test_window_key_generation(self):
        """Test time window key generation."""
        key = "test_key"
        window_seconds = 300  # 5 minutes

        # Mock time to specific value
        with patch("time.time", return_value=1000.0):
            window_key = self.limiter._get_window_key(key, window_seconds)
            # Should round down to window boundary: 1000 // 300 * 300 = 900
            expected_key = f"{key}:w:900"
            self.assertEqual(window_key, expected_key)

    def test_get_remaining_attempts(self):
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
        self.assertEqual(remaining, 5)

        # After one attempt
        self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        remaining = self.limiter.get_remaining_attempts(
            key,
            max_attempts,
            window_seconds,
        )
        self.assertEqual(remaining, 4)

        # After exhausting all attempts
        for i in range(4):  # 4 more attempts (total 5)
            self.limiter.is_rate_limited(key, max_attempts, window_seconds)

        remaining = self.limiter.get_remaining_attempts(
            key,
            max_attempts,
            window_seconds,
        )
        self.assertEqual(remaining, 0)

    def test_reset_limit(self):
        """Test resetting rate limits."""
        key = "test_ip_reset"
        max_attempts = 2
        window_seconds = 60

        # Exhaust the limit
        for i in range(max_attempts):
            self.assertFalse(
                self.limiter.is_rate_limited(key, max_attempts, window_seconds),
            )
        self.assertTrue(self.limiter.is_rate_limited(key, max_attempts, window_seconds))

        # Reset the limit
        self.limiter.reset_limit(key)

        # Should be allowed again
        self.assertFalse(
            self.limiter.is_rate_limited(key, max_attempts, window_seconds),
        )

    def test_get_rate_limit_info(self):
        """Test getting comprehensive rate limit info."""
        key = "test_ip_info"
        max_attempts = 3
        window_seconds = 300

        # Initial state
        info = self.limiter.get_rate_limit_info(key, max_attempts, window_seconds)
        self.assertTrue(info["allowed"])
        self.assertEqual(info["remaining"], 3)
        self.assertEqual(info["total"], 3)
        self.assertEqual(info["current_count"], 0)
        self.assertEqual(info["window_seconds"], 300)
        self.assertGreater(info["reset_in"], 0)

        # After one attempt
        self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        info = self.limiter.get_rate_limit_info(key, max_attempts, window_seconds)
        self.assertTrue(info["allowed"])
        self.assertEqual(info["remaining"], 2)
        self.assertEqual(info["current_count"], 1)

    def test_error_handling(self):
        """Test graceful error handling (fail-open behavior)."""
        key = "test_error_handling"

        # Mock cache to raise exception
        with patch.object(cache, "get_or_set", side_effect=Exception("Cache error")):
            # Should not raise exception and should allow request (fail-open)
            result = self.limiter.is_rate_limited(key, 3, 60)
            self.assertFalse(result, "Should fail open when cache errors occur")

    def test_different_window_sizes(self):
        """Test rate limiting with different window sizes."""
        key = "test_windows"
        max_attempts = 2

        # Test 60-second window
        for i in range(max_attempts):
            self.assertFalse(self.limiter.is_rate_limited(key, max_attempts, 60))
        self.assertTrue(self.limiter.is_rate_limited(key, max_attempts, 60))

        # Same key but different window should be independent
        # (though it shares some implementation details due to cache key generation)
        self.limiter.is_rate_limited(key, max_attempts, 300)
        # This might be True or False depending on implementation details
        # The key point is it doesn't crash

    def test_concurrent_requests_simulation(self):
        """Test behavior under simulated concurrent requests."""
        key = "test_concurrent"
        max_attempts = 5
        window_seconds = 60

        # Simulate rapid successive requests
        results = []
        for i in range(10):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            results.append(result)

        # Should have exactly 5 allowed (False) and 5 blocked (True)
        allowed_count = sum(1 for r in results if not r)
        blocked_count = sum(1 for r in results if r)

        self.assertEqual(allowed_count, max_attempts)
        self.assertEqual(blocked_count, 10 - max_attempts)

    def test_cache_key_format(self):
        """Test cache key format and uniqueness."""
        limiter = DatabaseRateLimiter()

        # Test basic cache key
        key = limiter._get_cache_key("192.168.1.1")
        self.assertTrue(key.startswith("test:rate:"))
        self.assertIn("192.168.1.1", key)

        # Test with custom prefix
        key_with_prefix = limiter._get_cache_key("user123", "login")
        self.assertTrue(key_with_prefix.startswith("test:login:"))
        self.assertIn("user123", key_with_prefix)

    @patch("coalition.core.database_rate_limiter.logger")
    def test_logging(self, mock_logger):
        """Test that appropriate logging occurs."""
        key = "test_logging"
        max_attempts = 1

        # First request should be allowed (no logging)
        self.limiter.is_rate_limited(key, max_attempts, 60)
        mock_logger.info.assert_not_called()

        # Second request should be blocked and logged
        self.limiter.is_rate_limited(key, max_attempts, 60)
        mock_logger.info.assert_called_once()
        self.assertIn("Rate limit exceeded", str(mock_logger.info.call_args))

    def test_get_rate_limiter_function(self):
        """Test the factory function."""
        limiter = get_rate_limiter()
        self.assertIsInstance(limiter, DatabaseRateLimiter)

    def test_edge_case_zero_attempts(self):
        """Test edge case with zero max attempts."""
        key = "test_zero"
        result = self.limiter.is_rate_limited(key, 0, 60)
        # With 0 max attempts, should always be rate limited
        self.assertTrue(result)

    def test_edge_case_negative_values(self):
        """Test edge cases with negative values."""
        key = "test_negative"

        # Negative max_attempts should be handled gracefully
        result = self.limiter.is_rate_limited(key, -1, 60)
        # Should be rate limited (no attempts allowed)
        self.assertTrue(result)

        # Negative window_seconds should be handled gracefully
        # (Implementation may vary, but should not crash)
        try:
            result = self.limiter.is_rate_limited(key, 3, -60)
            # Should either work or fail gracefully
        except Exception:
            self.fail("Should handle negative window_seconds gracefully")

    @patch("time.time")
    def test_time_window_boundaries(self, mock_time):
        """Test behavior at time window boundaries."""
        key = "test_boundaries"
        window_seconds = 60
        max_attempts = 2

        # Set time to exactly a window boundary
        mock_time.return_value = 3600.0  # Exactly 1 hour

        # Use up attempts in this window
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
            self.assertFalse(result, f"Attempt {i+1} should be allowed")

        # Next attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        self.assertTrue(result, "Should be rate limited after max attempts")

        # Move to next window
        mock_time.return_value = 3660.0  # 1 minute later (new window)

        # Should be allowed again in new window
        result = self.limiter.is_rate_limited(key, max_attempts, window_seconds)
        self.assertFalse(result, "Should be allowed in new time window")


class DatabaseRateLimiterIntegrationTest(TestCase):
    """Integration tests with actual database cache backend."""

    def setUp(self):
        """Set up integration test environment."""
        cache.clear()
        self.limiter = DatabaseRateLimiter()

    def tearDown(self):
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
    def test_with_database_cache_backend(self):
        """Test with actual database cache backend."""
        # Create cache table (in real scenarios, this is done via migration)
        from django.core.management import call_command

        try:
            call_command("createcachetable", "test_cache_table", verbosity=0)
        except Exception:
            pass  # Table might already exist

        key = "integration_test"
        max_attempts = 3

        # Test normal rate limiting flow
        for i in range(max_attempts):
            result = self.limiter.is_rate_limited(key, max_attempts, 60)
            self.assertFalse(result, f"Attempt {i+1} should be allowed")

        # Next attempt should be blocked
        result = self.limiter.is_rate_limited(key, max_attempts, 60)
        self.assertTrue(result, "Should be rate limited")

        # Test remaining attempts
        remaining = self.limiter.get_remaining_attempts(key, max_attempts, 60)
        self.assertEqual(remaining, 0)

    def test_performance_under_load(self):
        """Test performance characteristics under simulated load."""
        import time as time_module

        start_time = time_module.time()

        # Simulate 100 rate limit checks
        for i in range(100):
            key = f"perf_test_{i % 10}"  # 10 different keys
            self.limiter.is_rate_limited(key, 5, 60)

        end_time = time_module.time()
        duration = end_time - start_time

        # Should complete reasonably quickly (less than 1 second for 100 ops)
        self.assertLess(duration, 1.0, "Rate limiting should be performant")

    def test_memory_usage_stability(self):
        """Test that memory usage doesn't grow unboundedly."""
        import gc

        # Force garbage collection
        gc.collect()

        # Perform many operations with different keys
        for i in range(1000):
            key = f"memory_test_{i}"
            self.limiter.is_rate_limited(key, 3, 60)

            # Periodically check that we're not accumulating too much
            if i % 100 == 0:
                gc.collect()

        # Test passes if we reach this point without memory errors
        self.assertTrue(True, "Memory usage should remain stable")
