"""Tests for configure_zappa.py."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import patch

from scripts.configure_zappa import configure_zappa_settings


def _generate_settings(
    tmp_path: Path,
    env_vars: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Run configure_zappa_settings and return parsed output."""
    env: dict[str, str] = {
        "DATABASE_URL": "",
        "SECRET_KEY": "",
    }
    if env_vars:
        env.update(env_vars)

    output_file = tmp_path / "zappa_settings.json"
    real_open = open

    def fake_open(path: Any, mode: str = "r", **kwargs: Any) -> Any:
        if str(path).endswith("zappa_settings.json") and "w" in mode:
            return real_open(output_file, mode, **kwargs)
        return real_open(path, mode, **kwargs)

    with patch.dict("os.environ", env, clear=True), patch(
        "builtins.open",
        side_effect=fake_open,
    ):
        configure_zappa_settings()

    return json.loads(output_file.read_text())


class TestRoleName:
    """Tests for role_name in generated settings."""

    def test_base_config_includes_role_name(self, tmp_path: Path) -> None:
        """role_name should be present in the base config."""
        settings = _generate_settings(tmp_path)
        assert "role_name" in settings["base"]

    def test_role_name_is_coalition_zappa_deployment(self, tmp_path: Path) -> None:
        """role_name should be set to the Terraform-managed role."""
        settings = _generate_settings(tmp_path)
        assert settings["base"]["role_name"] == "coalition-zappa-deployment"


class TestDefaultSecretARNs:
    """Tests for default secret ARN behavior when env vars are not set."""

    def test_default_database_url_is_empty_string(self, tmp_path: Path) -> None:
        """Without DATABASE_SECRET_ARN env var, DATABASE_URL should be empty."""
        settings = _generate_settings(tmp_path)
        assert settings["dev"]["aws_environment_variables"]["DATABASE_URL"] == ""

    def test_default_secret_key_is_empty_string(self, tmp_path: Path) -> None:
        """Without DJANGO_SECRET_ARN env var, SECRET_KEY should be empty."""
        settings = _generate_settings(tmp_path)
        assert settings["dev"]["aws_environment_variables"]["SECRET_KEY"] == ""

    def test_default_database_url_not_wildcard(self, tmp_path: Path) -> None:
        """Default should not contain IAM wildcard pattern."""
        settings = _generate_settings(tmp_path)
        db_url = settings["dev"]["aws_environment_variables"]["DATABASE_URL"]
        assert "*" not in db_url

    def test_default_secret_key_not_wildcard(self, tmp_path: Path) -> None:
        """Default should not contain IAM wildcard pattern."""
        settings = _generate_settings(tmp_path)
        secret_key = settings["dev"]["aws_environment_variables"]["SECRET_KEY"]
        assert "*" not in secret_key

    def test_all_stages_have_empty_defaults(self, tmp_path: Path) -> None:
        """All stages should have empty string defaults for secret ARNs."""
        settings = _generate_settings(tmp_path)
        for stage in ("dev", "staging", "prod"):
            env_vars = settings[stage]["aws_environment_variables"]
            assert env_vars["DATABASE_URL"] == "", f"{stage} DATABASE_URL not empty"
            assert env_vars["SECRET_KEY"] == "", f"{stage} SECRET_KEY not empty"


class TestProvidedSecretARNs:
    """Tests for secret ARN behavior when env vars ARE provided."""

    def test_database_url_uses_provided_arn(self, tmp_path: Path) -> None:
        """When DATABASE_SECRET_ARN is set, it should be used."""
        arn = "arn:aws:secretsmanager:us-east-1:123456789:secret:my-db-secret-AbCdEf"
        settings = _generate_settings(
            tmp_path,
            {"DATABASE_SECRET_ARN": arn},
        )
        assert settings["prod"]["aws_environment_variables"]["DATABASE_URL"] == arn

    def test_secret_key_uses_provided_arn(self, tmp_path: Path) -> None:
        """When DJANGO_SECRET_ARN is set, it should be used."""
        arn = "arn:aws:secretsmanager:us-east-1:123456789:secret:my-django-key-XyZwVu"
        settings = _generate_settings(
            tmp_path,
            {"DJANGO_SECRET_ARN": arn},
        )
        assert settings["prod"]["aws_environment_variables"]["SECRET_KEY"] == arn
