"""Tests for Lambda-specific settings configuration."""

import os
from importlib import reload
from unittest.mock import patch

from django.test import TestCase


class LambdaStorageSettingsTest(TestCase):
    """Test that Lambda uses S3 storage backends when USE_S3 is enabled."""

    def setUp(self) -> None:
        """Store original environment."""
        self.original_env = os.environ.copy()

    def tearDown(self) -> None:
        """Restore original environment."""
        os.environ.clear()
        os.environ.update(self.original_env)

    def test_staticfiles_storage_uses_s3_in_lambda(self) -> None:
        """Staticfiles backend must use S3 when in Lambda with USE_S3=true."""
        from coalition.core import settings as settings_module

        with patch.dict(
            os.environ,
            {
                "AWS_LAMBDA_FUNCTION_NAME": "test-function",
                "USE_S3": "true",
                "SECRET_KEY": "test-secret-key",
                "ENVIRONMENT": "test",
                "AWS_STORAGE_BUCKET_NAME": "test-bucket",
            },
            clear=False,
        ):
            reload(settings_module)

            staticfiles_backend = settings_module.STORAGES["staticfiles"]["BACKEND"]
            assert (
                staticfiles_backend == "coalition.core.storage.StaticStorage"
            ), f"Expected StaticStorage for Lambda, got {staticfiles_backend}"
