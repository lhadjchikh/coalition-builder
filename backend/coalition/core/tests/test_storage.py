"""Tests for custom storage backend."""

import os
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings

from coalition.core.storage import MediaStorage, StaticStorage


class MediaStorageTest(TestCase):
    """Test custom MediaStorage backend."""

    def setUp(self) -> None:
        """Set up test fixtures."""
        self.storage = MediaStorage()

    def test_storage_location(self) -> None:
        """Test that storage uses correct location."""
        assert self.storage.location == "media"

    def test_storage_file_overwrite(self) -> None:
        """Test that file overwrite is disabled."""
        assert not self.storage.file_overwrite

    def test_storage_default_acl(self) -> None:
        """Test that default ACL is public-read."""
        assert self.storage.default_acl == "public-read"

    @patch.dict(os.environ, {"ECS_CONTAINER_METADATA_URI_V4": "http://test"})
    @patch("coalition.core.storage.logger")
    def test_init_logs_ecs_v4_metadata(self, mock_logger: Mock) -> None:
        """Test that initialization logs ECS metadata URI v4."""
        MediaStorage()
        mock_logger.info.assert_any_call(
            "Running in ECS with metadata URI v4: http://test",
        )

    @patch.dict(os.environ, {"ECS_CONTAINER_METADATA_URI": "http://test-v3"})
    @patch("coalition.core.storage.logger")
    def test_init_logs_ecs_v3_metadata(self, mock_logger: Mock) -> None:
        """Test that initialization logs ECS metadata URI v3."""
        MediaStorage()
        mock_logger.info.assert_any_call(
            "Running in ECS with metadata URI v3: http://test-v3",
        )

    @patch("coalition.core.storage.boto3.Session")
    @patch("coalition.core.storage.logger")
    def test_init_logs_no_credentials(
        self,
        mock_logger: Mock,
        mock_session: Mock,
    ) -> None:
        """Test that initialization logs when no credentials are found."""
        mock_session.return_value.get_credentials.return_value = None
        MediaStorage()
        mock_logger.error.assert_any_call("Boto3 could not find any credentials!")

    @patch("coalition.core.storage.boto3.Session")
    @patch("coalition.core.storage.logger")
    def test_init_logs_credentials_found(
        self,
        mock_logger: Mock,
        mock_session: Mock,
    ) -> None:
        """Test that initialization logs when credentials are found."""
        mock_credentials = Mock()
        mock_credentials.method = "test-method"
        mock_session.return_value.get_credentials.return_value = mock_credentials
        MediaStorage()
        mock_logger.info.assert_any_call("Boto3 found credentials via: test-method")

    @patch("coalition.core.storage.boto3.Session")
    @patch("coalition.core.storage.logger")
    def test_init_handles_exception(
        self,
        mock_logger: Mock,
        mock_session: Mock,
    ) -> None:
        """Test that initialization handles exceptions gracefully."""
        mock_session.side_effect = Exception("Test error")
        MediaStorage()
        mock_logger.error.assert_any_call("Error checking AWS credentials: Test error")

    @override_settings(AWS_S3_REGION_NAME="us-test-1")
    def test_create_session_uses_default_credential_chain(self) -> None:
        """Test that _create_session omits explicit credentials for IAM roles."""
        storage = MediaStorage()
        with patch("coalition.core.storage.boto3.Session") as mock_session:
            storage._create_session()
            mock_session.assert_called_once_with(region_name="us-test-1")


class StaticStorageTest(TestCase):
    """Test custom StaticStorage backend."""

    def test_static_storage_no_acl(self) -> None:
        """Test that StaticStorage does not set ACLs (bucket disallows them)."""
        storage = StaticStorage()
        assert storage.default_acl is None
