"""Custom storage backends for Coalition Builder."""

import logging
import os
from typing import Any

import boto3
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage

logger = logging.getLogger(__name__)


class MediaStorage(S3Boto3Storage):
    """
    Custom S3 storage for media files.

    This ensures that all generated URLs use CloudFront domain when available,
    even in the Django admin immediately after upload.
    """

    location = "media"
    file_overwrite = False
    default_acl = "public-read"
    querystring_auth = False  # Don't add auth to URLs since files are public

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize storage with custom domain if CloudFront is available."""
        # Log debugging information about AWS credentials
        try:
            # Check if we're in ECS
            ecs_metadata_uri = os.environ.get("ECS_CONTAINER_METADATA_URI_V4")
            ecs_metadata_uri_v3 = os.environ.get("ECS_CONTAINER_METADATA_URI")
            if ecs_metadata_uri:
                logger.info(f"Running in ECS with metadata URI v4: {ecs_metadata_uri}")
            elif ecs_metadata_uri_v3:
                logger.info(
                    f"Running in ECS with metadata URI v3: {ecs_metadata_uri_v3}",
                )

            # Check AWS environment variables
            aws_vars = {
                "AWS_REGION": os.environ.get("AWS_REGION"),
                "AWS_DEFAULT_REGION": os.environ.get("AWS_DEFAULT_REGION"),
                "AWS_STORAGE_BUCKET_NAME": os.environ.get("AWS_STORAGE_BUCKET_NAME"),
                "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI": os.environ.get(
                    "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
                ),
            }
            logger.info(f"AWS environment variables: {aws_vars}")

            # Test credential chain
            session = boto3.Session()
            credentials = session.get_credentials()
            if credentials:
                logger.info(f"Boto3 found credentials via: {credentials.method}")
            else:
                logger.error("Boto3 could not find any credentials!")

        except Exception as e:
            logger.error(f"Error checking AWS credentials: {e}")

        super().__init__(*args, **kwargs)
        # The custom_domain setting will be set from AWS_S3_CUSTOM_DOMAIN in settings
        # which already uses CloudFront when available

    def _get_boto3_session(self) -> Any:
        """Create a new boto3 session to ensure fresh credentials."""
        # Create a new session each time to ensure we get fresh credentials
        # This is important for ECS task roles which use temporary credentials
        return boto3.Session(
            region_name=settings.AWS_S3_REGION_NAME,
            # Don't specify credentials - let boto3 use the credential chain
            aws_access_key_id=None,
            aws_secret_access_key=None,
            aws_session_token=None,
        )
