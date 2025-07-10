"""Content application configuration."""

from django.apps import AppConfig


class ContentConfig(AppConfig):
    """Configuration for the content app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "coalition.content"
    verbose_name = "Content Management"
