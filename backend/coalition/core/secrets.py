"""Resolve AWS Secrets Manager ARNs to their actual values at Lambda startup."""

import json
import logging
from functools import lru_cache

import boto3

logger = logging.getLogger(__name__)

_ARN_PREFIX = "arn:aws:secretsmanager:"


def is_arn(value: str) -> bool:
    """Check if a value is a Secrets Manager ARN."""
    return value.startswith(_ARN_PREFIX)


@lru_cache(maxsize=16)
def resolve_secret(value: str, json_key: str) -> str:
    """Resolve a value that may be a Secrets Manager ARN.

    If the value is an ARN, fetch the secret and extract the
    specified JSON key. Otherwise, return the value unchanged.
    """
    if not is_arn(value):
        return value

    client = boto3.client("secretsmanager")
    resp = client.get_secret_value(SecretId=value)
    try:
        secret = json.loads(resp["SecretString"])
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Secret {value!r} must contain valid JSON in SecretString",
        ) from exc
    try:
        resolved = secret[json_key]
    except KeyError as exc:
        raise KeyError(
            f"Secret {value!r} does not contain expected key {json_key!r}",
        ) from exc
    logger.info("Resolved secret successfully")
    return resolved
