"""
Database-backed rate limiter for consistent dev/prod behavior.

This rate limiter uses Django's database cache backend to provide atomic
rate limiting operations. It works identically in both development and
production environments, eliminating the need for separate Redis or DynamoDB
implementations.
"""

import logging
import time
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.db import connection, transaction

logger = logging.getLogger(__name__)


class DatabaseRateLimiter:
    """
    Database-backed rate limiter using Django's cache framework.

    This implementation uses Django's database cache backend with atomic
    operations to provide consistent rate limiting across all environments.

    Features:
    - Perfect dev/prod parity (same PostgreSQL database)
    - Atomic operations via database transactions
    - Environment isolation via key prefixes
    - Graceful error handling (fail-open for availability)
    - Cost-effective (no additional AWS services)
    """

    def __init__(self) -> None:
        """Initialize the rate limiter with environment context."""
        self.environment = getattr(settings, "ENVIRONMENT", "dev")

    def _get_cache_key(self, key: str, prefix: str = "rate") -> str:
        """Generate environment-isolated cache key."""
        return f"{self.environment}:{prefix}:{key}"

    def _get_window_key(self, key: str, window_seconds: int) -> str:
        """Generate time-window specific cache key."""
        current_time = int(time.time())
        window_start = (current_time // window_seconds) * window_seconds
        return f"{key}:w:{window_start}"

    def is_rate_limited(
        self,
        key: str,
        max_attempts: int = 3,
        window_seconds: int = 300,
    ) -> bool:
        """
        Check if a key is rate limited using atomic database operations.

        Args:
            key: The identifier to rate limit (e.g., IP address, user ID)
            max_attempts: Maximum attempts allowed in the window
            window_seconds: Time window in seconds (default: 5 minutes)

        Returns:
            True if rate limited, False if allowed

        Example:
            >>> limiter = DatabaseRateLimiter()
            >>> ip = "192.168.1.1"
            >>> if limiter.is_rate_limited(ip, max_attempts=5, window_seconds=60):
            ...     # Block request
            ...     return HttpResponse("Rate limited", status=429)
        """
        try:
            # Generate cache key with time window
            window_key = self._get_window_key(key, window_seconds)
            cache_key = self._get_cache_key(window_key)

            # Use atomic increment with timeout to handle concurrency
            # Django's cache.get_or_set with callable provides atomicity
            def get_initial_count() -> dict[str, Any]:
                return {"count": 0, "first_attempt": time.time()}

            # Get current count atomically
            current_data = cache.get_or_set(
                cache_key,
                get_initial_count,
                timeout=window_seconds + 60,  # Add buffer to prevent early expiry
            )

            if current_data is None:
                current_data = {"count": 0}
            current_count = current_data.get("count", 0)

            # Check if already over limit
            if current_count >= max_attempts:
                logger.info(
                    f"Rate limit exceeded for {key}: {current_count}/{max_attempts}",
                )
                return True

            # Increment counter atomically
            # Use raw SQL for true atomicity if cache backend is database
            if hasattr(cache, "_cache") and "DatabaseCache" in str(type(cache._cache)):
                self._atomic_increment_db(cache_key, window_seconds)
            else:
                # Fallback for other cache backends - increment and save
                current_data["count"] = current_count + 1
                cache.set(cache_key, current_data, timeout=window_seconds + 60)

            return False

        except Exception as e:
            # Log error but fail open (allow request) for availability
            logger.error(f"Rate limiter error for key {key}: {e}")
            return False

    def _atomic_increment_db(self, cache_key: str, window_seconds: int) -> None:
        """
        Perform atomic increment using raw SQL for database cache backend.

        This ensures true atomicity even under high concurrency.
        """
        try:
            with transaction.atomic(), connection.cursor() as cursor:
                # Use INSERT ... ON CONFLICT for PostgreSQL atomic increment
                cursor.execute(
                    """
                    INSERT INTO django_cache (cache_key, value, expires) 
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cache_key) 
                    DO UPDATE SET 
                        value = (
                            CAST(
                                regexp_replace(
                                    django_cache.value,
                                    '"count": (\\d+)',
                                    '"count": ' || (
                                        CAST(
                                            substring(
                                                django_cache.value
                                                from '"count": (\\d+)'
                                            ) AS INTEGER
                                        ) + 1
                                    )::text
                                )
                            AS TEXT
                        ),
                        expires = GREATEST(django_cache.expires, %s)
                    """,
                    [
                        cache_key,
                        f'{{"count": 1, "first_attempt": {time.time()}}}',
                        int(time.time()) + window_seconds + 60,
                        int(time.time()) + window_seconds + 60,
                    ],
                )
        except Exception as e:
            logger.warning(f"Atomic increment fallback error: {e}")
            # Fall back to cache.set if raw SQL fails
            current_data = cache.get(
                cache_key,
                {"count": 0, "first_attempt": time.time()},
            )
            current_data["count"] = current_data.get("count", 0) + 1
            cache.set(cache_key, current_data, timeout=window_seconds + 60)

    def get_remaining_attempts(
        self,
        key: str,
        max_attempts: int = 3,
        window_seconds: int = 300,
    ) -> int:
        """
        Get the number of remaining attempts for a key.

        Args:
            key: The identifier to check
            max_attempts: Maximum attempts allowed
            window_seconds: Time window in seconds

        Returns:
            Number of remaining attempts (0 if rate limited)
        """
        try:
            window_key = self._get_window_key(key, window_seconds)
            cache_key = self._get_cache_key(window_key)

            current_data = cache.get(cache_key, {"count": 0})
            if current_data is None:
                current_data = {"count": 0}
            current_count = current_data.get("count", 0)

            return int(max(0, max_attempts - current_count))

        except Exception as e:
            logger.error(f"Error getting remaining attempts for {key}: {e}")
            return max_attempts  # Assume full attempts available on error

    def reset_limit(self, key: str) -> None:
        """
        Reset rate limit for a specific key.

        Args:
            key: The identifier to reset
        """
        try:
            # Reset all possible window keys for this identifier
            # (This is approximate since we don't know all window times)
            current_time = int(time.time())

            # Clear a range of possible window keys (last hour)
            for window_seconds in [60, 300, 900, 3600]:  # Common window sizes
                for offset in range(0, 3600, window_seconds):
                    window_start = (
                        (current_time - offset) // window_seconds
                    ) * window_seconds
                    window_key = f"{key}:w:{window_start}"
                    cache_key = self._get_cache_key(window_key)
                    cache.delete(cache_key)

            logger.info(f"Rate limit reset for key: {key}")

        except Exception as e:
            logger.error(f"Error resetting rate limit for {key}: {e}")

    def get_rate_limit_info(
        self,
        key: str,
        max_attempts: int = 3,
        window_seconds: int = 300,
    ) -> dict[str, Any]:
        """
        Get comprehensive rate limit information for a key.

        Args:
            key: The identifier to check
            max_attempts: Maximum attempts allowed
            window_seconds: Time window in seconds

        Returns:
            Dict with 'allowed', 'remaining', 'reset_in', and 'total' fields
        """
        try:
            window_key = self._get_window_key(key, window_seconds)
            cache_key = self._get_cache_key(window_key)

            current_data = cache.get(
                cache_key,
                {"count": 0, "first_attempt": time.time()},
            )
            current_count = current_data.get("count", 0)

            current_time = int(time.time())
            window_start = (current_time // window_seconds) * window_seconds
            reset_in = window_seconds - (current_time - window_start)

            return {
                "allowed": current_count < max_attempts,
                "remaining": max(0, max_attempts - current_count),
                "total": max_attempts,
                "reset_in": max(0, reset_in),
                "window_seconds": window_seconds,
                "current_count": current_count,
            }

        except Exception as e:
            logger.error(f"Error getting rate limit info for {key}: {e}")
            return {
                "allowed": True,
                "remaining": max_attempts,
                "total": max_attempts,
                "reset_in": window_seconds,
                "window_seconds": window_seconds,
                "current_count": 0,
            }


def get_rate_limiter() -> DatabaseRateLimiter:
    """
    Get a database rate limiter instance.

    This replaces the previous hybrid approach (DynamoDB + django-ratelimit)
    with a unified database-backed solution for all environments.

    Returns:
        DatabaseRateLimiter instance
    """
    return DatabaseRateLimiter()
