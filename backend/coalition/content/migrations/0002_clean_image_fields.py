# Data migration to clean image fields before altering field types
from django.db import migrations


def clean_image_fields(apps, schema_editor):
    """Clean any empty string values in image fields before converting to ForeignKey."""
    ContentBlock = apps.get_model("content", "ContentBlock")
    HomePage = apps.get_model("content", "HomePage")

    # Update any ContentBlock records where image is an empty string
    ContentBlock.objects.filter(image="").update(image=None)

    # Update any HomePage records where hero_background_image is an empty string
    HomePage.objects.filter(hero_background_image="").update(hero_background_image=None)


def reverse_clean_image_fields(apps, schema_editor):
    """Reverse operation - no action needed."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(clean_image_fields, reverse_clean_image_fields),
    ]
