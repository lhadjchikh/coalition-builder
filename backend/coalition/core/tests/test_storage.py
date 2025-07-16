"""Tests for custom storage backend."""

from django.test import TestCase

from coalition.core.storage import MediaStorage


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
