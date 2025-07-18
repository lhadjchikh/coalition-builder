# Generated by Django 5.2.4 on 2025-07-16 16:39

import django.db.models.deletion
import tinymce.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("campaigns", "0001_initial"),
        ("content", "0003_remove_contentblock_homepage_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="policycampaign",
            name="image",
            field=models.ForeignKey(
                blank=True,
                help_text="Hero image for the campaign displayed on detail page and cards",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="campaign_images",
                to="content.image",
            ),
        ),
        migrations.AlterField(
            model_name="policycampaign",
            name="description",
            field=tinymce.models.HTMLField(
                blank=True,
                help_text="Additional context/details about the campaign",
            ),
        ),
        migrations.AlterField(
            model_name="policycampaign",
            name="endorsement_form_instructions",
            field=tinymce.models.HTMLField(
                blank=True,
                help_text="Custom instructions shown above the endorsement form",
            ),
        ),
    ]
