#!/usr/bin/env python3
"""
Configure zappa_settings.json from environment variables or GitHub secrets.
This allows open-source contributors to use their own AWS resources.
"""

import json
import os
import sys
from pathlib import Path


def get_env_or_default(key: str, default: str = "") -> str:
    """Get environment variable or return default value."""
    return os.environ.get(key, default)


def configure_zappa_settings(output_path: Path | None = None) -> None:
    """Generate zappa_settings.json from environment variables."""

    # Get AWS account details
    aws_account_id = get_env_or_default("AWS_ACCOUNT_ID", "*")
    aws_region = get_env_or_default("AWS_REGION", "us-east-1")

    # Get ECR registry (if using custom Docker images)
    ecr_registry = get_env_or_default(
        "ECR_REGISTRY",
        f"{aws_account_id}.dkr.ecr.{aws_region}.amazonaws.com",
    )

    # Get bucket names (from Terraform output or manual configuration)
    zappa_deployment_bucket = get_env_or_default(
        "ZAPPA_S3_BUCKET",
        "coalition-zappa-deployments",
    )

    # Get asset bucket names
    dev_assets_bucket = get_env_or_default("DEV_ASSETS_BUCKET", "coalition-dev-assets")
    staging_assets_bucket = get_env_or_default(
        "STAGING_ASSETS_BUCKET",
        "coalition-staging-assets",
    )
    production_assets_bucket = get_env_or_default(
        "PRODUCTION_ASSETS_BUCKET",
        "coalition-production-assets",
    )

    # Get database names
    dev_db_name = get_env_or_default("DEV_DB_NAME", "coalition_dev")
    staging_db_name = get_env_or_default("STAGING_DB_NAME", "coalition_staging")
    production_db_name = get_env_or_default(
        "PRODUCTION_DB_NAME",
        "coalition_production",
    )

    # Get VPC configuration (optional)
    vpc_subnet_ids = get_env_or_default("VPC_SUBNET_IDS", "").split(",")
    vpc_security_group_ids = get_env_or_default("VPC_SECURITY_GROUP_IDS", "").split(",")

    # Clean up empty strings from lists
    vpc_subnet_ids = [s.strip() for s in vpc_subnet_ids if s.strip()]
    vpc_security_group_ids = [s.strip() for s in vpc_security_group_ids if s.strip()]

    # Get secret ARNs (empty default = local dev; CI provides real ARNs)
    db_secret_arn = get_env_or_default("DATABASE_SECRET_ARN", "")
    django_secret_arn = get_env_or_default("DJANGO_SECRET_ARN", "")

    # Fail fast in CI if secret ARNs are missing
    if os.environ.get("CI"):
        missing = [
            name
            for name, value in (
                ("DATABASE_SECRET_ARN", db_secret_arn),
                ("DJANGO_SECRET_ARN", django_secret_arn),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(
                "Missing required env var(s) in CI: " + ", ".join(missing),
            )

    # Docker image configuration
    # USE_CUSTOM_DOCKER=true: deploy as container image (docker_image_uri)
    # USE_CUSTOM_DOCKER=false: package inside Docker, deploy as zip (docker_image)
    use_custom_docker = (
        get_env_or_default("USE_CUSTOM_DOCKER", "false").lower() == "true"
    )

    if use_custom_docker:
        docker_image_key = "docker_image_uri"
        dev_docker_image = f"{ecr_registry}/coalition-dev:latest"
        staging_docker_image = f"{ecr_registry}/coalition-staging:latest"
        production_docker_image = f"{ecr_registry}/coalition-prod:latest"
    else:
        docker_image_key = "docker_image"
        dev_docker_image = "public.ecr.aws/lambda/python:3.13"
        staging_docker_image = "public.ecr.aws/lambda/python:3.13"
        production_docker_image = "public.ecr.aws/lambda/python:3.13"

    # Build the configuration
    settings = {
        "base": {
            "aws_region": aws_region,
            "django_settings": "coalition.core.settings",
            "project_name": "coalition",
            "s3_bucket": zappa_deployment_bucket,
            "runtime": "python3.13",
            "vpc_config": {
                "SubnetIds": vpc_subnet_ids,
                "SecurityGroupIds": vpc_security_group_ids,
            },
            "role_name": get_env_or_default(
                "ZAPPA_ROLE_NAME",
                "coalition-zappa-deployment",
            ),
            "timeout_seconds": 30,
            "slim_handler": False,
            "use_precompiled_packages": False,
            "environment_variables": {
                "USE_S3": "true",
                "IS_LAMBDA": "true",
                "USE_GEODJANGO": "true",
                "GDAL_DATA": "/opt/share/gdal",
                "PROJ_LIB": "/opt/share/proj",
                "LD_LIBRARY_PATH": "/opt/lib:/opt/lib64",
            },
            "exclude": [
                "*.gz",
                "*.rar",
                "*.zip",
                "*.tar",
                ".git/*",
                "tests/*",
                "*.pyc",
                "local/*",
                "docker/*",
                "scripts/build-docker.sh",
                "node_modules/*",
                ".pytest_cache/*",
                "__pycache__/*",
                "*.egg-info/*",
                ".coverage",
                "htmlcov/*",
                "docs/*",
            ],
            "cors": True,
            "cors_allow_headers": [
                "Content-Type",
                "X-CSRFToken",
                "Authorization",
                "X-Requested-With",
            ],
            "apigateway_settings": {
                "throttle_burst_limit": 100,
                "throttle_rate_limit": 50,
            },
        },
        "dev": {
            "extends": "base",
            "stage": "dev",
            docker_image_key: dev_docker_image,
            "memory_size": 512,
            "keep_warm": False,
            "environment_variables": {
                "ENVIRONMENT": "dev",
                "DEBUG": "true",
                "DATABASE_NAME": dev_db_name,
                "AWS_STORAGE_BUCKET_NAME": dev_assets_bucket,
            },
            "aws_environment_variables": {
                "DATABASE_URL": db_secret_arn,
                "SECRET_KEY": django_secret_arn,
            },
            "apigateway_settings": {
                "throttle_burst_limit": 50,
                "throttle_rate_limit": 25,
            },
        },
        "staging": {
            "extends": "base",
            "stage": "staging",
            docker_image_key: staging_docker_image,
            "memory_size": 512,
            "keep_warm": True,
            "keep_warm_expression": "rate(10 minutes)",
            "environment_variables": {
                "ENVIRONMENT": "staging",
                "DEBUG": "false",
                "DATABASE_NAME": staging_db_name,
                "AWS_STORAGE_BUCKET_NAME": staging_assets_bucket,
            },
            "aws_environment_variables": {
                "DATABASE_URL": db_secret_arn,
                "SECRET_KEY": django_secret_arn,
            },
            "apigateway_settings": {
                "throttle_burst_limit": 75,
                "throttle_rate_limit": 40,
            },
        },
        "prod": {
            "extends": "base",
            "stage": "prod",
            docker_image_key: production_docker_image,
            "memory_size": 1024,
            "keep_warm": True,
            "keep_warm_expression": "rate(4 minutes)",
            "environment_variables": {
                "ENVIRONMENT": "production",
                "DEBUG": "false",
                "DATABASE_NAME": production_db_name,
                "AWS_STORAGE_BUCKET_NAME": production_assets_bucket,
            },
            "aws_environment_variables": {
                "DATABASE_URL": db_secret_arn,
                "SECRET_KEY": django_secret_arn,
            },
            "apigateway_settings": {
                "throttle_burst_limit": 100,
                "throttle_rate_limit": 50,
            },
            "xray_tracing": True,
        },
    }

    # Write the configuration with Prettier-compatible formatting
    config_path = output_path or Path(__file__).parent.parent / "zappa_settings.json"
    with open(config_path, "w") as f:
        # Add trailing newline for Prettier compatibility
        json.dump(settings, f, indent=2)
        f.write("\n")

    print(f"✅ Generated zappa_settings.json at {config_path}")
    print("\nConfiguration summary:")
    print(f"  AWS Region: {aws_region}")
    print(f"  AWS Account: {aws_account_id}")
    print(f"  Zappa Bucket: {zappa_deployment_bucket}")
    print("  Asset Buckets:")
    print(f"    - Dev: {dev_assets_bucket}")
    print(f"    - Staging: {staging_assets_bucket}")
    print(f"    - Production: {production_assets_bucket}")
    print(f"  Custom Docker: {use_custom_docker}")
    if vpc_subnet_ids:
        print(f"  VPC Subnets: {', '.join(vpc_subnet_ids)}")
    if vpc_security_group_ids:
        print(f"  Security Groups: {', '.join(vpc_security_group_ids)}")


def main() -> None:
    """Main entry point."""
    # Check if we're in CI/CD environment
    if os.environ.get("CI"):
        print("🔧 Running in CI/CD environment")
    else:
        print("🔧 Configuring Zappa settings from environment variables")

    try:
        configure_zappa_settings()
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
