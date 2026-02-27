import json
from typing import Any
from unittest.mock import MagicMock, patch

from django.test import TestCase

from coalition.core.secrets import is_arn, resolve_secret


class IsArnTests(TestCase):
    def test_valid_secretsmanager_arn(self) -> None:
        arn = "arn:aws:secretsmanager:us-east-1" ":123456789012:secret:my-secret-AbCdEf"
        assert is_arn(arn)

    def test_arn_with_different_region(self) -> None:
        arn = "arn:aws:secretsmanager:eu-west-1" ":123456789012:secret:test"
        assert is_arn(arn)

    def test_regular_value_is_not_arn(self) -> None:
        assert not is_arn("postgis://user:pass@host:5432/db")

    def test_empty_string_is_not_arn(self) -> None:
        assert not is_arn("")

    def test_django_insecure_key_is_not_arn(self) -> None:
        assert not is_arn(
            "django-insecure-=lvqp2vsu5)=!t*_qzm3%h%7btagcgw1" "#cj^sut9f@95^vbclv",
        )


class ResolveSecretTests(TestCase):
    @patch("coalition.core.secrets._get_client")
    def test_resolves_arn_and_extracts_json_key(
        self,
        mock_get_client: Any,
    ) -> None:
        mock_sm = MagicMock()
        mock_get_client.return_value = mock_sm
        mock_sm.get_secret_value.return_value = {
            "SecretString": json.dumps(
                {"url": "postgis://user:pass@host:5432/db"},
            ),
        }

        arn = (
            "arn:aws:secretsmanager:us-east-1"
            ":123456789012:secret:coalition/database-url"
        )
        result = resolve_secret(arn, "url")

        assert result == "postgis://user:pass@host:5432/db"
        mock_sm.get_secret_value.assert_called_once_with(
            SecretId=arn,
        )

    @patch("coalition.core.secrets._get_client")
    def test_resolves_secret_key(
        self,
        mock_get_client: Any,
    ) -> None:
        mock_sm = MagicMock()
        mock_get_client.return_value = mock_sm
        mock_sm.get_secret_value.return_value = {
            "SecretString": json.dumps(
                {"key": "super-secret-django-key"},
            ),
        }

        arn = (
            "arn:aws:secretsmanager:us-east-1"
            ":123456789012:secret:coalition/secret-key"
        )
        result = resolve_secret(arn, "key")

        assert result == "super-secret-django-key"

    def test_non_arn_passes_through_unchanged(self) -> None:
        value = "postgis://user:pass@host:5432/db"
        result = resolve_secret(value, "url")
        assert result == value

    def test_empty_string_passes_through(self) -> None:
        result = resolve_secret("", "url")
        assert result == ""

    @patch("coalition.core.secrets._get_client")
    def test_invalid_json_raises_value_error(
        self,
        mock_get_client: Any,
    ) -> None:
        mock_sm = MagicMock()
        mock_get_client.return_value = mock_sm
        mock_sm.get_secret_value.return_value = {
            "SecretString": "not-valid-json",
        }

        arn = "arn:aws:secretsmanager:us-east-1" ":123456789012:secret:bad-json"
        with self.assertRaisesRegex(ValueError, "bad-json.*valid JSON"):
            resolve_secret(arn, "url")

    @patch("coalition.core.secrets._get_client")
    def test_missing_key_raises_key_error(
        self,
        mock_get_client: Any,
    ) -> None:
        mock_sm = MagicMock()
        mock_get_client.return_value = mock_sm
        mock_sm.get_secret_value.return_value = {
            "SecretString": json.dumps({"wrong_key": "value"}),
        }

        arn = "arn:aws:secretsmanager:us-east-1" ":123456789012:secret:missing-key"
        with self.assertRaisesRegex(KeyError, "missing-key.*expected key"):
            resolve_secret(arn, "url")
