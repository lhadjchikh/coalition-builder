"""Django admin for site-wide configuration."""

from django import forms
from django.contrib import admin
from django.http import HttpRequest

from coalition.core.models import SiteConfiguration, get_timezone_choices


class SiteConfigurationForm(forms.ModelForm):
    """Present valid IANA timezone names as a select control."""

    timezone = forms.ChoiceField(choices=get_timezone_choices)

    class Meta:
        model = SiteConfiguration
        fields = ("timezone",)


@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    """Expose the one site configuration without destructive actions."""

    form = SiteConfigurationForm
    fields = ("timezone",)

    def has_add_permission(self, request: HttpRequest) -> bool:
        """Allow creation only when the singleton does not exist."""
        return not SiteConfiguration.objects.exists() and super().has_add_permission(
            request,
        )

    def has_delete_permission(
        self,
        request: HttpRequest,  # noqa: ARG002
        obj: SiteConfiguration | None = None,  # noqa: ARG002
    ) -> bool:
        """Keep the singleton available once it has been configured."""
        return False
