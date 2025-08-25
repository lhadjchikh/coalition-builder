"""
DynamoDB-based rate limiter for serverless environments.

Provides rate limiting functionality using DynamoDB as the backend storage,
suitable for Lambda deployments where Redis is not available.
"""

import logging
import time
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from django.conf import settings


class DynamoDBRateLimiter:
    """
    Rate limiter using shared DynamoDB table with environment prefixes.

    Single table serves all environments to minimize costs.
    Cost: ~$1/month for all environments combined.
    """

    def __init__(self) -> None:
        """Initialize the rate limiter with DynamoDB client."""
        self.table_name = "coalition-rate-limits"  # Shared table
        self.environment = getattr(settings, "ENVIRONMENT", "dev")
        self.dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        self.table = self.dynamodb.Table(self.table_name)

    def is_rate_limited(
        self,
        key: str,
        max_attempts: int = 3,
        window_seconds: int = 300,
    ) -> bool:
        """
        Check if a key is rate limited with environment isolation.

        Args:
            key: The key to check (e.g., IP address or user ID)
            max_attempts: Maximum attempts allowed in the window
            window_seconds: Time window in seconds

        Returns:
            True if rate limited, False otherwise
        """
        current_time = Decimal(str(time.time()))
        window_start = current_time - Decimal(str(window_seconds))

        # Include environment in the key for isolation
        env_key = f"{self.environment}#RATE#{key}"

        try:
            # Query attempts within window
            response = self.table.query(
                KeyConditionExpression=Key("pk").eq(env_key)
                & Key("sk").between(window_start, current_time),
            )

            attempts = response.get("Count", 0)

            if attempts >= max_attempts:
                return True

            # Record this attempt with environment prefix
            self.table.put_item(
                Item={
                    "pk": env_key,
                    "sk": current_time,
                    "ttl": int(current_time) + window_seconds + 3600,
                    "timestamp": str(current_time),
                    "environment": self.environment,
                },
            )

            return False

        except ClientError as e:
            # Log error but don't block requests if DynamoDB is unavailable
            logging.error(f"DynamoDB rate limit error: {e}")
            return False

    def reset(self, key: str) -> None:
        """
        Reset rate limit for a key in current environment.

        Args:
            key: The key to reset
        """
        env_key = f"{self.environment}#RATE#{key}"

        try:
            # Query all items for this key in this environment
            response = self.table.query(KeyConditionExpression=Key("pk").eq(env_key))

            # Delete all items
            with self.table.batch_writer() as batch:
                for item in response["Items"]:
                    batch.delete_item(Key={"pk": item["pk"], "sk": item["sk"]})

        except ClientError as e:
            logging.error(f"DynamoDB reset error: {e}")

    def get_remaining_attempts(
        self,
        key: str,
        max_attempts: int = 3,
        window_seconds: int = 300,
    ) -> int:
        """
        Get the number of remaining attempts for a key.

        Args:
            key: The key to check
            max_attempts: Maximum attempts allowed
            window_seconds: Time window in seconds

        Returns:
            Number of remaining attempts
        """
        current_time = Decimal(str(time.time()))
        window_start = current_time - Decimal(str(window_seconds))
        env_key = f"{self.environment}#RATE#{key}"

        try:
            response = self.table.query(
                KeyConditionExpression=Key("pk").eq(env_key)
                & Key("sk").between(window_start, current_time),
            )
            attempts = int(response.get("Count", 0))
            return max(0, max_attempts - attempts)

        except ClientError:
            return max_attempts  # Default to full attempts on error


def get_rate_limiter() -> DynamoDBRateLimiter | None:
    """
    Get a rate limiter instance based on the environment.

    Returns:
        DynamoDBRateLimiter instance if in Lambda, None otherwise
    """
    if getattr(settings, "IS_LAMBDA", False):
        return DynamoDBRateLimiter()
    return None
