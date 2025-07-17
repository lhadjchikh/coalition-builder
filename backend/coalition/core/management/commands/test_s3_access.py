"""Management command to test S3 access and debug credential issues."""

import os

import boto3
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    """Test S3 access and credential chain."""

    help = "Test S3 access and debug AWS credential issues"

    def handle(self, *args: list, **options: dict) -> None:
        """Execute the command."""
        # These arguments are required by Django but not used
        del args, options
        self.stdout.write("=" * 60)
        self.stdout.write("Testing S3 Access and AWS Credentials")
        self.stdout.write("=" * 60)

        # 1. Check environment variables
        self.stdout.write("\n1. Environment Variables:")
        env_vars = [
            "AWS_REGION",
            "AWS_DEFAULT_REGION",
            "AWS_STORAGE_BUCKET_NAME",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "AWS_SESSION_TOKEN",
            "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
            "ECS_CONTAINER_METADATA_URI_V4",
        ]
        for var in env_vars:
            value = os.environ.get(var)
            if var in ["AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"] and value:
                # Mask sensitive values
                value = value[:4] + "..." + value[-4:] if len(value) > 8 else "***"
            self.stdout.write(f"  {var}: {value or 'Not set'}")

        # 2. Test boto3 credential chain
        self.stdout.write("\n2. Boto3 Credential Chain:")
        try:
            session = boto3.Session()
            credentials = session.get_credentials()
            if credentials:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ Credentials found via: {credentials.method}",
                    ),
                )
                # Test frozen credentials
                frozen = credentials.get_frozen_credentials()
                self.stdout.write(
                    f"  Access Key: {frozen.access_key[:4]}...{frozen.access_key[-4:]}",
                )
                self.stdout.write(f"  Has token: {'Yes' if frozen.token else 'No'}")
            else:
                self.stdout.write(self.style.ERROR("  ✗ No credentials found!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error: {e}"))

        # 3. Test S3 client
        self.stdout.write("\n3. S3 Client Test:")
        bucket_name = os.environ.get("AWS_STORAGE_BUCKET_NAME")
        if not bucket_name:
            self.stdout.write(self.style.ERROR("  ✗ AWS_STORAGE_BUCKET_NAME not set!"))
            return

        try:
            s3 = boto3.client("s3")
            # Test list bucket
            s3.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
            self.stdout.write(
                self.style.SUCCESS(f"  ✓ Can list objects in bucket: {bucket_name}"),
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"  ✗ Cannot access bucket {bucket_name}: {e}"),
            )

        # 4. Test Django storage
        self.stdout.write("\n4. Django Storage Test:")
        try:
            from django.core.files.storage import default_storage

            # Create a test file
            test_content = f"Test upload at {timezone.now().isoformat()}".encode()
            test_file = ContentFile(test_content, name="test_upload.txt")

            # Try to save it
            path = default_storage.save("test/test_upload.txt", test_file)
            self.stdout.write(self.style.SUCCESS(f"  ✓ File saved to: {path}"))

            # Get the URL
            url = default_storage.url(path)
            self.stdout.write(f"  URL: {url}")

            # Try to delete it
            default_storage.delete(path)
            self.stdout.write(self.style.SUCCESS("  ✓ Test file deleted"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Storage test failed: {e}"))

        # 5. Check IAM permissions
        self.stdout.write("\n5. IAM Permissions Check:")
        try:
            sts = boto3.client("sts")
            identity = sts.get_caller_identity()
            self.stdout.write(self.style.SUCCESS("  ✓ Current identity:"))
            self.stdout.write(f"    Account: {identity['Account']}")
            self.stdout.write(f"    ARN: {identity['Arn']}")
            self.stdout.write(f"    UserId: {identity['UserId']}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Cannot get identity: {e}"))

        self.stdout.write("\n" + "=" * 60)
