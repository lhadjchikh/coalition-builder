"""Tests for deployment-time database secret validation."""

import json
import logging
from argparse import Namespace
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from scripts.validate_database_secret import (
    DatabaseSecretValidationError,
    main,
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
            expected_database_name="coalition_dev",
        )

        assert database_name == "coalition_dev"

    def test_rejects_a_secret_from_another_aws_account(self) -> None:
        client = _secrets_client()

        with pytest.raises(DatabaseSecretValidationError, match="AWS account"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "999999999999",
                "dev",
                expected_database_name="coalition_dev",
            )

        client.get_secret_value.assert_not_called()

    def test_rejects_a_malformed_secret_arn(self) -> None:
        client = _secrets_client()

        with pytest.raises(DatabaseSecretValidationError, match="Secrets Manager ARN"):
            validate_database_secret(
                client,
                "not-an-arn",
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

        client.describe_secret.assert_not_called()

    def test_rejects_a_secret_tagged_for_another_environment(self) -> None:
        client = _secrets_client(environment="prod")

        with pytest.raises(DatabaseSecretValidationError, match="Environment tag"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

        client.get_secret_value.assert_not_called()

    def test_rejects_malformed_secret_tags_with_an_accurate_error(self) -> None:
        client = _secrets_client()
        client.describe_secret.return_value = {"Tags": {"Environment": "dev"}}

        with pytest.raises(DatabaseSecretValidationError, match="valid tag list"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_disagreement_between_url_and_dbname(self) -> None:
        client = _secrets_client(url_database_name="coalition")

        with pytest.raises(DatabaseSecretValidationError, match="URL database"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_disagreement_with_authoritative_database_tag(self) -> None:
        client = _secrets_client(tagged_database_name="coalition")

        with pytest.raises(DatabaseSecretValidationError, match="DatabaseName tag"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_an_internally_consistent_wrong_database(self) -> None:
        client = _secrets_client(
            database_name="coalition",
            tagged_database_name="coalition",
            url_database_name="coalition",
        )

        with pytest.raises(DatabaseSecretValidationError, match="expected database"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_invalid_secret_json(self) -> None:
        client = _secrets_client()
        client.get_secret_value.return_value = {"SecretString": "not-json"}

        with pytest.raises(DatabaseSecretValidationError, match="valid JSON"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_a_secret_without_a_string_payload(self) -> None:
        client = _secrets_client()
        client.get_secret_value.return_value = {}

        with pytest.raises(DatabaseSecretValidationError, match="SecretString"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_rejects_a_non_object_secret_payload(self) -> None:
        client = _secrets_client()
        client.get_secret_value.return_value = {
            "SecretString": json.dumps(["coalition_dev"]),
        }

        with pytest.raises(DatabaseSecretValidationError, match="must be an object"):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    @pytest.mark.parametrize(
        ("secret_payload", "error_message"),
        [
            (
                {
                    "dbname": "",
                    "url": "postgis://application:password@database.internal/coalition_dev",
                },
                "non-empty 'dbname'",
            ),
            (
                {"dbname": "coalition_dev", "url": ""},
                "non-empty 'url'",
            ),
            (
                {
                    "dbname": "coalition_dev",
                    "url": "mysql://application:password@database.internal/coalition_dev",
                },
                "PostgreSQL scheme",
            ),
            (
                {
                    "dbname": "coalition_dev",
                    "url": "postgis://application:password@database.internal",
                },
                "exactly one database",
            ),
        ],
    )
    def test_rejects_invalid_secret_database_fields(
        self,
        secret_payload: dict[str, str],
        error_message: str,
    ) -> None:
        client = _secrets_client()
        client.get_secret_value.return_value = {
            "SecretString": json.dumps(secret_payload),
        }

        with pytest.raises(DatabaseSecretValidationError, match=error_message):
            validate_database_secret(
                client,
                SECRET_ARN,
                "123456789012",
                "dev",
                expected_database_name="coalition_dev",
            )

    def test_reports_aws_failures_as_structured_errors(
        self,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        client = _secrets_client()
        client.describe_secret.side_effect = ClientError(
            {
                "Error": {
                    "Code": "AccessDeniedException",
                    "Message": "sensitive-provider-detail",
                },
            },
            "DescribeSecret",
        )
        arguments = Namespace(
            secret_arn=SECRET_ARN,
            expected_account_id="123456789012",
            expected_environment="dev",
            expected_database_name="coalition_dev",
        )

        with (
            patch(
                "scripts.validate_database_secret._parse_arguments",
                return_value=arguments,
            ),
            patch("scripts.validate_database_secret.boto3.client", return_value=client),
            caplog.at_level(logging.ERROR),
            pytest.raises(SystemExit) as exit_error,
        ):
            main()

        assert exit_error.value.code == 1
        assert "outcome=failure error_class=ClientError" in caplog.text
        assert "AWS Secrets Manager request failed" in caplog.text
        assert "sensitive-provider-detail" not in caplog.text
