# Generated manually for email verification system

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("endorsements", "0001_initial"),
    ]

    operations = [
        # Add fields without unique constraint first
        migrations.AddField(
            model_name="endorsement",
            name="verification_token",
            field=models.UUIDField(default=uuid.uuid4),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="verification_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Email Verification"),
                    ("verified", "Email Verified"),
                    ("approved", "Approved for Display"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="admin_notes",
            field=models.TextField(blank=True, help_text="Internal notes for admins"),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reviewed_endorsements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="endorsement",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        # Generate unique tokens for existing records
        migrations.RunPython(
            lambda _apps, _schema_editor: None,  # No existing records to update in new system
            reverse_code=migrations.RunPython.noop,
        ),
        # Now add unique constraint
        migrations.AlterField(
            model_name="endorsement",
            name="verification_token",
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
    ]
