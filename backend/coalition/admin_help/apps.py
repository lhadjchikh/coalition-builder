from django.apps import AppConfig


class AdminHelpConfig(AppConfig):
    """The help guide is templates and Markdown only — it owns no database tables."""

    name = "coalition.admin_help"
    label = "admin_help"
    verbose_name = "Admin help guide"
