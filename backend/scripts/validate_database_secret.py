#!/usr/bin/env python3
"""Validate a deployment database secret without exposing its contents."""

import argparse
import json
import logging
from collections.abc import Mapping
from typing import Protocol
from urllib.parse import unquote, urlparse

import boto3
from botocore.config import Config

logger = logging.getLogger(__name__)


class DatabaseSecretValidationError(RuntimeError):
    """Raised when a database secret crosses a deployment boundary."""


class SecretsManagerClient(Protocol):
    """Secrets Manager operations required by deployment validation."""

    def describe_secret(
        self,
        *,
        SecretId: str,  # noqa: N803 - boto3's public parameter is capitalized
    ) -> Mapping[str, object]:
        """Return secret metadata."""

    def get_secret_value(
        self,
        *,
        SecretId: str,  # noqa: N803 - boto3's public parameter is capitalized
    ) -> Mapping[str, object]:
        """Return the current secret value."""


def validate_database_secret(
    client: SecretsManagerClient,
    secret_arn: str,
    expected_account_id: str,
    expected_environment: str,
    *,
    expected_database_name: str,
) -> str:
    """Validate secret ownership and return its expected database name."""
    _validate_arn_account(secret_arn, expected_account_id)
    secret_tags = _load_secret_tags(client, secret_arn)
    _validate_environment_tag(secret_tags, expected_environment)
    secret_payload = _load_secret_payload(client, secret_arn)
    database_name = _required_string(secret_payload, "dbname")
    if database_name != expected_database_name:
        raise DatabaseSecretValidationError(
            "Secret dbname does not match the expected database.",
        )
    tagged_database_name = _required_tag(secret_tags, "DatabaseName")
    if database_name != tagged_database_name:
        raise DatabaseSecretValidationError(
            "Secret DatabaseName tag does not match its dbname field.",
        )
    url_database_name = _database_name_from_url(
        _required_string(secret_payload, "url"),
    )
    if url_database_name != database_name:
        raise DatabaseSecretValidationError(
            "Secret URL database does not match its dbname field.",
        )
    return database_name


def _validate_arn_account(secret_arn: str, expected_account_id: str) -> None:
    arn_parts = secret_arn.split(":", maxsplit=5)
    if len(arn_parts) != 6 or arn_parts[0:3] != ["arn", "aws", "secretsmanager"]:
        raise DatabaseSecretValidationError(
            "DATABASE_SECRET_ARN must be an AWS Secrets Manager ARN.",
        )
    if arn_parts[4] != expected_account_id:
        raise DatabaseSecretValidationError(
            "Database secret belongs to a different AWS account.",
        )


def _load_secret_tags(
    client: SecretsManagerClient,
    secret_arn: str,
) -> Mapping[str, str]:
    metadata = client.describe_secret(SecretId=secret_arn)
    tags = metadata.get("Tags")
    if not isinstance(tags, list):
        raise DatabaseSecretValidationError(
            "Database secret has no Environment tag.",
        )
    return {
        tag["Key"]: tag["Value"]
        for tag in tags
        if isinstance(tag, dict)
        and isinstance(tag.get("Key"), str)
        and isinstance(tag.get("Value"), str)
    }


def _validate_environment_tag(
    secret_tags: Mapping[str, str],
    expected_environment: str,
) -> None:
    environment = secret_tags.get("Environment")
    if environment != expected_environment:
        raise DatabaseSecretValidationError(
            "Database secret Environment tag does not match the deployment.",
        )


def _required_tag(secret_tags: Mapping[str, str], key: str) -> str:
    tag = secret_tags.get(key)
    if not tag:
        raise DatabaseSecretValidationError(
            f"Database secret must have a non-empty {key} tag.",
        )
    return tag


def _load_secret_payload(
    client: SecretsManagerClient,
    secret_arn: str,
) -> Mapping[str, object]:
    response = client.get_secret_value(SecretId=secret_arn)
    secret_string = response.get("SecretString")
    if not isinstance(secret_string, str):
        raise DatabaseSecretValidationError(
            "Database secret must contain a SecretString.",
        )
    try:
        secret_payload = json.loads(secret_string)
    except json.JSONDecodeError as error:
        raise DatabaseSecretValidationError(
            "Database secret must contain valid JSON.",
        ) from error
    if not isinstance(secret_payload, dict):
        raise DatabaseSecretValidationError(
            "Database secret JSON must be an object.",
        )
    return secret_payload


def _required_string(secret_payload: Mapping[str, object], key: str) -> str:
    field = secret_payload.get(key)
    if not isinstance(field, str) or not field:
        raise DatabaseSecretValidationError(
            f"Database secret must contain a non-empty {key!r} string.",
        )
    return field


def _database_name_from_url(database_url: str) -> str:
    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in {"postgis", "postgres", "postgresql"}:
        raise DatabaseSecretValidationError(
            "Database secret URL must use a PostgreSQL scheme.",
        )
    database_name = unquote(parsed_url.path.removeprefix("/"))
    if not database_name or "/" in database_name:
        raise DatabaseSecretValidationError(
            "Database secret URL must identify exactly one database.",
        )
    return database_name


def _parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--secret-arn", required=True)
    parser.add_argument("--expected-account-id", required=True)
    parser.add_argument(
        "--expected-environment", choices=("dev", "prod"), required=True
    )
    parser.add_argument("--expected-database-name", required=True)
    return parser.parse_args()


def main() -> None:
    """Validate the selected deployment's database secret."""
    arguments = _parse_arguments()
    client = boto3.client(
        "secretsmanager",
        config=Config(
            connect_timeout=5,
            read_timeout=10,
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    )
    try:
        validate_database_secret(
            client,
            arguments.secret_arn,
            arguments.expected_account_id,
            arguments.expected_environment,
            expected_database_name=arguments.expected_database_name,
        )
    except DatabaseSecretValidationError as error:
        logger.error(
            "stage=database-secret-validation correlation=deployment-%s "
            "outcome=failure error_class=%s message=%s",
            arguments.expected_environment,
            type(error).__name__,
            error,
        )
        raise SystemExit(1) from error
    logger.info(
        "stage=database-secret-validation correlation=deployment-%s outcome=success",
        arguments.expected_environment,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
