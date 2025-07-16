"""Custom storage backends for Coalition Builder."""

from typing import Any

from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    """
    Custom S3 storage for media files.

    This ensures that all generated URLs use CloudFront domain when available,
    even in the Django admin immediately after upload.
    """

    location = "media"
    file_overwrite = False
    default_acl = "public-read"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize storage with custom domain if CloudFront is available."""
        super().__init__(*args, **kwargs)
        # The custom_domain setting will be set from AWS_S3_CUSTOM_DOMAIN in settings
        # which already uses CloudFront when available
