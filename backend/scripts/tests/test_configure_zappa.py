"""Tests for configure_zappa.py."""

import json
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

from scripts.configure_zappa import (
    RUNTIME_ENVIRONMENT_VARIABLES,
    configure_zappa_settings,
)


def _generate_settings(
    tmp_path: Path,
    env_vars: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Run configure_zappa_settings and return parsed output."""
    env: dict[str, str] = dict(env_vars) if env_vars else {}
    output_file = tmp_path / "zappa_settings.json"

    with patch.dict("os.environ", env, clear=True):
        configure_zappa_settings(output_path=output_file)

    return json.loads(output_file.read_text())


class TestRoleManagement:
    """Tests for manage_roles and role_name in generated settings."""

    def test_manage_roles_is_false(self, tmp_path: Path) -> None:
        """manage_roles should be False so Zappa uses the Terraform-managed role."""
        settings = _generate_settings(tmp_path)
        assert settings["base"]["manage_roles"] is False

    def test_base_config_includes_role_name(self, tmp_path: Path) -> None:
        """role_name should be present in the base config."""
        settings = _generate_settings(tmp_path)
        assert "role_name" in settings["base"]

    def test_role_name_default(self, tmp_path: Path) -> None:
        """role_name should default to the Terraform-managed role."""
        settings = _generate_settings(tmp_path)
        assert settings["base"]["role_name"] == "coalition-zappa-deployment"

    def test_role_name_configurable_via_env_var(self, tmp_path: Path) -> None:
        """role_name should be configurable via ZAPPA_ROLE_NAME env var."""
        settings = _generate_settings(
            tmp_path,
            {"ZAPPA_ROLE_NAME": "my-custom-role"},
        )
        assert settings["base"]["role_name"] == "my-custom-role"


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

    def test_all_default_stages_have_empty_defaults(self, tmp_path: Path) -> None:
        """Default stages (dev, prod) have empty string defaults."""
        settings = _generate_settings(tmp_path)
        for stage in ("dev", "prod"):
            env_vars = settings[stage]["aws_environment_variables"]
            assert env_vars["DATABASE_URL"] == "", f"{stage} DATABASE_URL not empty"
            assert env_vars["SECRET_KEY"] == "", f"{stage} SECRET_KEY not empty"


class TestProvidedSecretARNs:
    """Tests for secret ARN behavior when env vars ARE provided."""

    def test_database_url_uses_provided_arn(self, tmp_path: Path) -> None:
        """When DATABASE_SECRET_ARN is set, it should be used."""
        arn = "arn:aws:secretsmanager:us-east-1:123456789:secret:my-db-AbCdEf"
        settings = _generate_settings(
            tmp_path,
            {"DATABASE_SECRET_ARN": arn},
        )
        assert settings["prod"]["aws_environment_variables"]["DATABASE_URL"] == arn

    def test_secret_key_uses_provided_arn(self, tmp_path: Path) -> None:
        """When DJANGO_SECRET_ARN is set, it should be used."""
        arn = "arn:aws:secretsmanager:us-east-1:123456789:secret:my-dj-XyZwVu"
        settings = _generate_settings(
            tmp_path,
            {"DJANGO_SECRET_ARN": arn},
        )
        assert settings["prod"]["aws_environment_variables"]["SECRET_KEY"] == arn


# #316 Definition of Done: the database secret URL is the sole database-name source.
class TestDatabaseIsolation:
    def test_runtime_stages_do_not_override_the_secret_database_name(
        self,
        tmp_path: Path,
    ) -> None:
        settings = _generate_settings(
            tmp_path,
            {"ENABLE_STAGING": "true"},
        )

        for stage in ("dev", "staging", "prod"):
            assert "DATABASE_NAME" not in settings[stage]["environment_variables"]


class TestLoggingConfiguration:
    def test_base_stage_suppresses_sdk_debug_payloads(self, tmp_path: Path) -> None:
        settings = _generate_settings(tmp_path)

        assert settings["base"]["log_level"] == "INFO"


class TestLocationConfiguration:
    """Tests for the AWS Location place index in generated settings."""

    def test_place_index_name_is_added_to_each_stage_aws_environment(
        self,
        tmp_path: Path,
    ) -> None:
        """Every stage must expose the place index through Lambda configuration."""
        settings = _generate_settings(
            tmp_path,
            {
                "AWS_LOCATION_PLACE_INDEX_NAME": "landandbay-geocoding-index",
                "ENABLE_STAGING": "true",
            },
        )

        for stage in ("dev", "staging", "prod"):
            assert (
                settings[stage]["aws_environment_variables"][
                    "AWS_LOCATION_PLACE_INDEX_NAME"
                ]
                == "landandbay-geocoding-index"
            )
            assert (
                "AWS_LOCATION_PLACE_INDEX_NAME"
                not in settings[stage]["environment_variables"]
            )

    def test_unconfigured_place_index_is_omitted_outside_ci(
        self,
        tmp_path: Path,
    ) -> None:
        """Local settings should not contain a misleading empty index name."""
        settings = _generate_settings(tmp_path)

        for stage in ("dev", "prod"):
            for environment_key in (
                "environment_variables",
                "aws_environment_variables",
            ):
                assert (
                    "AWS_LOCATION_PLACE_INDEX_NAME"
                    not in settings[stage][environment_key]
                )

    def test_runtime_variables_are_materialized_in_each_stage(
        self,
        tmp_path: Path,
    ) -> None:
        """Stage maps must retain runtime variables when overriding base settings."""
        settings = _generate_settings(tmp_path, {"ENABLE_STAGING": "true"})

        for stage in ("dev", "staging", "prod"):
            stage_environment = settings[stage]["environment_variables"]
            assert RUNTIME_ENVIRONMENT_VARIABLES.items() <= stage_environment.items()


class TestAssetConfiguration:
    """Tests for media bucket environment variables."""

    def test_dev_uses_environment_scoped_bucket_name(self, tmp_path: Path) -> None:
        """The selected dev stage uses the environment-scoped bucket name."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "dev",
                "AWS_STORAGE_BUCKET_NAME": "coalition-dev-assets-example",
            },
        )
        assert (
            settings["dev"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "coalition-dev-assets-example"
        )

    def test_prod_uses_environment_scoped_bucket_name(self, tmp_path: Path) -> None:
        """The selected prod stage uses the environment-scoped bucket name."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "prod",
                "AWS_STORAGE_BUCKET_NAME": "coalition-production-assets-example",
                "CLOUDFRONT_DOMAIN": "media.example.cloudfront.net",
                "SITE_URL": "https://example.org",
                "DEFAULT_FROM_EMAIL": "admin@example.org",
            },
        )
        assert (
            settings["prod"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "coalition-production-assets-example"
        )

    def test_prod_uses_environment_scoped_cloudfront_domain(
        self,
        tmp_path: Path,
    ) -> None:
        """The selected prod stage receives its CloudFront media domain."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "prod",
                "AWS_STORAGE_BUCKET_NAME": "production-assets",
                "CLOUDFRONT_DOMAIN": "media.example.cloudfront.net",
                "SITE_URL": "https://example.org",
                "DEFAULT_FROM_EMAIL": "admin@example.org",
            },
        )
        assert (
            settings["prod"]["environment_variables"]["CLOUDFRONT_DOMAIN"]
            == "media.example.cloudfront.net"
        )
        assert "CLOUDFRONT_DOMAIN" not in settings["dev"]["environment_variables"]

    def test_dev_omits_cloudfront_domain_when_unconfigured(
        self,
        tmp_path: Path,
    ) -> None:
        """Direct-S3 dev deployments do not receive an empty CDN setting."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "dev",
                "AWS_STORAGE_BUCKET_NAME": "dev-assets",
            },
        )
        assert "CLOUDFRONT_DOMAIN" not in settings["dev"]["environment_variables"]

    def test_legacy_stage_specific_bucket_remains_supported(
        self,
        tmp_path: Path,
    ) -> None:
        """Local configuration can still use the legacy stage-specific input."""
        settings = _generate_settings(
            tmp_path,
            {"DEV_ASSETS_BUCKET": "legacy-dev-assets"},
        )
        assert (
            settings["dev"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "legacy-dev-assets"
        )


class TestDeploymentEnvironmentValidation:
    """Tests that misconfigured deployment stages fail fast instead of silently."""

    def test_unmatched_environment_with_bucket_raises(
        self,
        tmp_path: Path,
    ) -> None:
        """An unrecognized DEPLOYMENT_ENVIRONMENT must not silently drop the bucket."""
        with pytest.raises(RuntimeError, match="DEPLOYMENT_ENVIRONMENT"):
            _generate_settings(
                tmp_path,
                {
                    "DEPLOYMENT_ENVIRONMENT": "development",
                    "AWS_STORAGE_BUCKET_NAME": "coalition-dev-assets-example",
                },
            )

    def test_production_alias_is_rejected_in_favor_of_prod(
        self,
        tmp_path: Path,
    ) -> None:
        """'prod' is the canonical stage name; 'production' is not accepted."""
        with pytest.raises(RuntimeError, match="DEPLOYMENT_ENVIRONMENT"):
            _generate_settings(
                tmp_path,
                {
                    "DEPLOYMENT_ENVIRONMENT": "production",
                    "AWS_STORAGE_BUCKET_NAME": "coalition-production-assets-example",
                    "CLOUDFRONT_DOMAIN": "media.example.cloudfront.net",
                },
            )

    def test_unmatched_environment_without_bucket_does_not_raise(
        self,
        tmp_path: Path,
    ) -> None:
        """With no environment-scoped bucket set, nothing is dropped, so no error."""
        settings = _generate_settings(
            tmp_path,
            {"DEPLOYMENT_ENVIRONMENT": "development"},
        )
        assert (
            settings["dev"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "coalition-dev-assets"
        )

    def test_environment_is_whitespace_normalized(
        self,
        tmp_path: Path,
    ) -> None:
        """A stray trailing space still selects the intended stage bucket."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "dev ",
                "AWS_STORAGE_BUCKET_NAME": "coalition-dev-assets-example",
            },
        )
        assert (
            settings["dev"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "coalition-dev-assets-example"
        )

    def test_prod_without_cloudfront_domain_raises(
        self,
        tmp_path: Path,
    ) -> None:
        """Deploying prod without a CDN domain must fail at generation time."""
        with pytest.raises(RuntimeError, match="CLOUDFRONT_DOMAIN"):
            _generate_settings(
                tmp_path,
                {
                    "DEPLOYMENT_ENVIRONMENT": "prod",
                    "AWS_STORAGE_BUCKET_NAME": "coalition-production-assets-example",
                },
            )

    def test_non_prod_deployment_does_not_require_cloudfront_domain(
        self,
        tmp_path: Path,
    ) -> None:
        """Deploying dev builds the prod stage without demanding a CDN domain."""
        settings = _generate_settings(
            tmp_path,
            {
                "DEPLOYMENT_ENVIRONMENT": "dev",
                "AWS_STORAGE_BUCKET_NAME": "coalition-dev-assets-example",
            },
        )
        assert "CLOUDFRONT_DOMAIN" not in settings["prod"]["environment_variables"]

    def test_staging_without_enable_staging_raises(
        self,
        tmp_path: Path,
    ) -> None:
        """Selecting staging while it is off would silently drop the bucket.

        ``staging`` is a real stage name, but the staging stage is only
        generated when ``ENABLE_STAGING=true``. Selecting it while off routes
        the bucket to neither dev nor prod and emits no staging stage, so the
        provided bucket must be rejected rather than silently ignored.
        """
        with pytest.raises(RuntimeError, match="DEPLOYMENT_ENVIRONMENT"):
            _generate_settings(
                tmp_path,
                {
                    "DEPLOYMENT_ENVIRONMENT": "staging",
                    "AWS_STORAGE_BUCKET_NAME": "coalition-staging-assets-example",
                },
            )

    def test_staging_with_enable_staging_uses_bucket(
        self,
        tmp_path: Path,
    ) -> None:
        """With staging enabled, the staging stage uses the scoped bucket."""
        settings = _generate_settings(
            tmp_path,
            {
                "ENABLE_STAGING": "true",
                "DEPLOYMENT_ENVIRONMENT": "staging",
                "AWS_STORAGE_BUCKET_NAME": "coalition-staging-assets-example",
                "SITE_URL": "https://staging.example.org",
                "DEFAULT_FROM_EMAIL": "admin@example.org",
            },
        )
        assert (
            settings["staging"]["environment_variables"]["AWS_STORAGE_BUCKET_NAME"]
            == "coalition-staging-assets-example"
        )


class TestCIValidation:
    """Tests for CI environment validation of required env vars."""

    _arn = "arn:aws:secretsmanager:us-east-1:123:secret:x"

    def test_ci_raises_when_database_secret_arn_missing(
        self,
        tmp_path: Path,
    ) -> None:
        """In CI, missing DATABASE_SECRET_ARN should raise."""
        with pytest.raises(RuntimeError, match="DATABASE_SECRET_ARN"):
            _generate_settings(
                tmp_path,
                {"CI": "true", "DJANGO_SECRET_ARN": self._arn},
            )

    def test_ci_raises_when_django_secret_arn_missing(
        self,
        tmp_path: Path,
    ) -> None:
        """In CI, missing DJANGO_SECRET_ARN should raise."""
        with pytest.raises(RuntimeError, match="DJANGO_SECRET_ARN"):
            _generate_settings(
                tmp_path,
                {"CI": "true", "DATABASE_SECRET_ARN": self._arn},
            )

    def test_ci_raises_when_zappa_role_name_missing(
        self,
        tmp_path: Path,
    ) -> None:
        """In CI, missing ZAPPA_ROLE_NAME should raise."""
        with pytest.raises(RuntimeError, match="ZAPPA_ROLE_NAME"):
            _generate_settings(
                tmp_path,
                {
                    "CI": "true",
                    "DATABASE_SECRET_ARN": self._arn,
                    "DJANGO_SECRET_ARN": self._arn,
                },
            )

    def test_ci_raises_when_location_place_index_name_missing(
        self,
        tmp_path: Path,
    ) -> None:
        """In CI, missing AWS_LOCATION_PLACE_INDEX_NAME should raise."""
        with pytest.raises(RuntimeError, match="AWS_LOCATION_PLACE_INDEX_NAME"):
            _generate_settings(
                tmp_path,
                {
                    "CI": "true",
                    "DATABASE_SECRET_ARN": self._arn,
                    "DJANGO_SECRET_ARN": self._arn,
                    "ZAPPA_ROLE_NAME": "my-role",
                },
            )

    def test_ci_succeeds_when_all_required_vars_provided(
        self,
        tmp_path: Path,
    ) -> None:
        """In CI, providing all required vars should not raise."""
        settings = _generate_settings(
            tmp_path,
            {
                "CI": "true",
                "DATABASE_SECRET_ARN": self._arn,
                "DJANGO_SECRET_ARN": self._arn,
                "ZAPPA_ROLE_NAME": "my-role",
                "AWS_LOCATION_PLACE_INDEX_NAME": "landandbay-geocoding-index",
            },
        )
        db_url = settings["prod"]["aws_environment_variables"]
        assert db_url["DATABASE_URL"] != ""

    def test_non_ci_allows_empty_arns(
        self,
        tmp_path: Path,
    ) -> None:
        """Outside CI, empty ARNs should be allowed."""
        settings = _generate_settings(tmp_path)
        db_url = settings["dev"]["aws_environment_variables"]
        assert db_url["DATABASE_URL"] == ""


class TestStagingGating:
    """Tests for ENABLE_STAGING environment variable gating."""

    def test_staging_excluded_by_default(
        self,
        tmp_path: Path,
    ) -> None:
        """Without ENABLE_STAGING, staging key should not exist."""
        settings = _generate_settings(tmp_path)
        assert "staging" not in settings

    def test_staging_included_when_enabled(
        self,
        tmp_path: Path,
    ) -> None:
        """With ENABLE_STAGING=true, staging key should exist."""
        settings = _generate_settings(
            tmp_path,
            {"ENABLE_STAGING": "true"},
        )
        assert "staging" in settings
        assert settings["staging"]["stage"] == "staging"

    def test_staging_excluded_when_env_var_false(
        self,
        tmp_path: Path,
    ) -> None:
        """With ENABLE_STAGING=false, staging should not exist."""
        settings = _generate_settings(
            tmp_path,
            {"ENABLE_STAGING": "false"},
        )
        assert "staging" not in settings

    def test_default_stages_are_dev_and_prod(
        self,
        tmp_path: Path,
    ) -> None:
        """By default only dev and prod stages should be present."""
        settings = _generate_settings(tmp_path)
        stage_keys = {k for k in settings if k != "base"}
        assert stage_keys == {"dev", "prod"}


class TestEmailConfiguration:
    """Lambda needs email settings baked in, or mail is wrong rather than absent.

    Django defaults SITE_URL to http://localhost:3000, so a deploy without it
    sends verification links that no recipient can ever follow. That fails as
    quietly as an unreachable mail server, so prod deploys must refuse.
    """

    _prod_env = {
        "DEPLOYMENT_ENVIRONMENT": "prod",
        "CLOUDFRONT_DOMAIN": "cdn.example.org",
        "SITE_URL": "https://landandbay.org",
        "DEFAULT_FROM_EMAIL": "admin@landandbay.org",
    }

    def test_prod_receives_site_url_for_verification_links(
        self,
        tmp_path: Path,
    ) -> None:
        settings = _generate_settings(tmp_path, self._prod_env)

        env = settings["prod"]["environment_variables"]
        assert env["SITE_URL"] == "https://landandbay.org"

    def test_prod_receives_sender_address(self, tmp_path: Path) -> None:
        settings = _generate_settings(tmp_path, self._prod_env)

        env = settings["prod"]["environment_variables"]
        assert env["DEFAULT_FROM_EMAIL"] == "admin@landandbay.org"

    def test_optional_email_settings_are_passed_through(
        self,
        tmp_path: Path,
    ) -> None:
        settings = _generate_settings(
            tmp_path,
            {
                **self._prod_env,
                "API_URL": "https://api.landandbay.org",
                "ADMIN_NOTIFICATION_EMAILS": "ops@landandbay.org",
                "SES_CONFIGURATION_SET": "landandbay-config-set",
            },
        )

        env = settings["prod"]["environment_variables"]
        assert env["API_URL"] == "https://api.landandbay.org"
        assert env["ADMIN_NOTIFICATION_EMAILS"] == "ops@landandbay.org"
        assert env["SES_CONFIGURATION_SET"] == "landandbay-config-set"

    def test_unset_optional_email_settings_are_omitted(
        self,
        tmp_path: Path,
    ) -> None:
        """Empty values must not override Django's own defaults."""
        settings = _generate_settings(tmp_path, self._prod_env)

        env = settings["prod"]["environment_variables"]
        assert "ADMIN_NOTIFICATION_EMAILS" not in env
        assert "SES_CONFIGURATION_SET" not in env

    def test_prod_without_site_url_raises(self, tmp_path: Path) -> None:
        env = {k: v for k, v in self._prod_env.items() if k != "SITE_URL"}

        with pytest.raises(RuntimeError, match="SITE_URL"):
            _generate_settings(tmp_path, env)

    def test_prod_without_sender_address_raises(self, tmp_path: Path) -> None:
        env = {k: v for k, v in self._prod_env.items() if k != "DEFAULT_FROM_EMAIL"}

        with pytest.raises(RuntimeError, match="DEFAULT_FROM_EMAIL"):
            _generate_settings(tmp_path, env)

    def test_dev_deployment_does_not_require_email_settings(
        self,
        tmp_path: Path,
    ) -> None:
        """Dev logs mail to the console, so it needs no sender or site URL."""
        settings = _generate_settings(tmp_path, {"DEPLOYMENT_ENVIRONMENT": "dev"})

        assert "SITE_URL" not in settings["dev"]["environment_variables"]

    def test_selected_staging_receives_email_settings(self, tmp_path: Path) -> None:
        """A generated non-debug staging Lambda must not use local email defaults."""
        email_settings = {
            "SITE_URL": "https://staging.example.org",
            "API_URL": "https://api.staging.example.org",
            "DEFAULT_FROM_EMAIL": "admin@example.org",
            "ADMIN_NOTIFICATION_EMAILS": "ops@example.org",
            "SES_CONFIGURATION_SET": "example-staging",
        }

        settings = _generate_settings(
            tmp_path,
            {
                "ENABLE_STAGING": "true",
                "DEPLOYMENT_ENVIRONMENT": "staging",
                **email_settings,
            },
        )

        staging_environment = settings["staging"]["environment_variables"]
        assert all(
            staging_environment[name] == configured_value
            for name, configured_value in email_settings.items()
        )

    @pytest.mark.parametrize("missing_setting", ["SITE_URL", "DEFAULT_FROM_EMAIL"])
    def test_staging_requires_email_settings(
        self,
        tmp_path: Path,
        missing_setting: str,
    ) -> None:
        """Staging sends real mail and must reject local-development defaults."""
        email_settings = {
            "SITE_URL": "https://staging.example.org",
            "DEFAULT_FROM_EMAIL": "admin@example.org",
        }
        del email_settings[missing_setting]

        with pytest.raises(RuntimeError, match=missing_setting):
            _generate_settings(
                tmp_path,
                {
                    "ENABLE_STAGING": "true",
                    "DEPLOYMENT_ENVIRONMENT": "staging",
                    **email_settings,
                },
            )
