"""Core application configuration."""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration for site-wide behavior."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "coalition.core"
    verbose_name = "Site Administration"
