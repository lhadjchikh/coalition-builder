"""Tests for deployment-time database secret validation."""

import json
from unittest.mock import MagicMock

import pytest

from scripts.validate_database_secret import (
    DatabaseSecretValidationError,
    validate_database_secret,
)

SECRET_ARN = (
    "arn:aws:secretsmanager:us-east-1:123456789012:"
    "secret:coalition/dev/database-url-AbCdEf"
)


def _secrets_client(
    *,
    environment: str = "dev",
    database_name: str = "coalition_dev",
    tagged_database_name: str = "coalition_dev",
    url_database_name: str = "coalition_dev",
) -> MagicMock:
    client = MagicMock()
    client.describe_secret.return_value = {
        "Tags": [
            {"Key": "DatabaseName", "Value": tagged_database_name},
            {"Key": "Environment", "Value": environment},
        ],
    }
    client.get_secret_value.return_value = {
        "SecretString": json.dumps(
            {
                "dbname": database_name,
                "url": (
                    "postgis://application:password@database.internal:5432/"
                    f"{url_database_name}"
                ),
            },
        ),
    }
    return client


# #316 Definition of Done: fail before deployment when a secret can cross boundaries.
class TestDatabaseSecretIsolation:
    def test_accepts_matching_account_environment_and_database(self) -> None:
        client = _secrets_client()

        database_name = validate_database_secret(
            client,
            SECRET_ARN,
            "123456789012",
            "dev",
        )

        assert database_name == "coalition_dev"

    def test_rejects_a_secret_from_another_aws_account(self) -> None:
        client = _secrets_client()

        with pytest.raises(DatabaseSecretValidationError, match="AWS account"):
            validate_database_secret(client, SECRET_ARN, "999999999999", "dev")

        client.get_secret_value.assert_not_called()

    def test_rejects_a_secret_tagged_for_another_environment(self) -> None:
        client = _secrets_client(environment="prod")

        with pytest.raises(DatabaseSecretValidationError, match="Environment tag"):
            validate_database_secret(client, SECRET_ARN, "123456789012", "dev")

        client.get_secret_value.assert_not_called()

    def test_rejects_disagreement_between_url_and_dbname(self) -> None:
        client = _secrets_client(url_database_name="coalition")

        with pytest.raises(DatabaseSecretValidationError, match="URL database"):
            validate_database_secret(client, SECRET_ARN, "123456789012", "dev")

    def test_rejects_disagreement_with_authoritative_database_tag(self) -> None:
        client = _secrets_client(tagged_database_name="coalition")

        with pytest.raises(DatabaseSecretValidationError, match="DatabaseName tag"):
            validate_database_secret(client, SECRET_ARN, "123456789012", "dev")

    def test_rejects_invalid_secret_json(self) -> None:
        client = _secrets_client()
        client.get_secret_value.return_value = {"SecretString": "not-json"}

        with pytest.raises(DatabaseSecretValidationError, match="valid JSON"):
            validate_database_secret(client, SECRET_ARN, "123456789012", "dev")
