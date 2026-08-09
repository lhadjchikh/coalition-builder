"""Tests for the site-wide administrator timezone."""

from django.conf import settings
from django.contrib import admin
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from django.test import RequestFactory, TestCase
from django.utils import timezone

from coalition.core.admin import SiteConfigurationAdmin
from coalition.core.middleware.timezone import AdminTimezoneMiddleware
from coalition.core.models import SiteConfiguration


class SiteConfigurationTest(TestCase):
    """The site configuration stores one valid IANA timezone."""

    def test_timezone_defaults_to_utc(self) -> None:
        configuration = SiteConfiguration()

        assert configuration.timezone == "UTC"

    def test_valid_timezone_passes_validation(self) -> None:
        configuration = SiteConfiguration(timezone="America/New_York")

        configuration.full_clean()

    def test_unknown_timezone_fails_validation(self) -> None:
        configuration = SiteConfiguration(timezone="Eastern Time")

        with self.assertRaises(ValidationError) as context:
            configuration.full_clean()

        assert "Select a valid timezone" in str(context.exception)

    def test_saving_again_updates_the_single_configuration(self) -> None:
        original = SiteConfiguration.objects.create(timezone="UTC")

        replacement = SiteConfiguration(timezone="America/Chicago")
        replacement.save()

        assert replacement.pk == original.pk
        assert SiteConfiguration.objects.count() == 1
        assert SiteConfiguration.objects.get().timezone == "America/Chicago"

    def test_configured_timezone_falls_back_to_django_setting(self) -> None:
        with self.settings(TIME_ZONE="America/New_York"):
            assert SiteConfiguration.get_timezone() == "America/New_York"


class AdminTimezoneMiddlewareTest(TestCase):
    """Admin requests use the configured timezone without leaking state."""

    def setUp(self) -> None:
        self.factory = RequestFactory()

    def tearDown(self) -> None:
        timezone.deactivate()

    def call_middleware(self, request: HttpRequest) -> str:
        active_timezone = ""

        def capture_timezone(captured_request: HttpRequest) -> HttpResponse:
            nonlocal active_timezone
            active_timezone = timezone.get_current_timezone_name()
            return HttpResponse()

        middleware = AdminTimezoneMiddleware(capture_timezone)
        middleware(request)
        return active_timezone

    def test_activates_site_timezone_for_admin_request(self) -> None:
        SiteConfiguration.objects.create(timezone="America/Los_Angeles")
        request = self.factory.get("/admin/")

        active_timezone = self.call_middleware(request)

        assert active_timezone == "America/Los_Angeles"
        assert timezone.get_current_timezone_name() == settings.TIME_ZONE

    def test_uses_default_timezone_without_configuration(self) -> None:
        request = self.factory.get("/admin/")

        assert self.call_middleware(request) == settings.TIME_ZONE

    def test_restores_preexisting_timezone_after_response(self) -> None:
        SiteConfiguration.objects.create(timezone="America/Denver")
        timezone.activate("Europe/Paris")
        request = self.factory.get("/admin/")

        self.call_middleware(request)

        assert timezone.get_current_timezone_name() == "Europe/Paris"

    def test_restores_preexisting_timezone_after_exception(self) -> None:
        SiteConfiguration.objects.create(timezone="America/Denver")
        timezone.activate("Europe/Paris")
        request = self.factory.get("/admin/")

        def raise_error(captured_request: HttpRequest) -> HttpResponse:
            raise RuntimeError("response failed")

        middleware = AdminTimezoneMiddleware(raise_error)
        with self.assertRaises(RuntimeError):
            middleware(request)

        assert timezone.get_current_timezone_name() == "Europe/Paris"

    def test_does_not_query_configuration_for_public_request(self) -> None:
        SiteConfiguration.objects.create(timezone="America/Los_Angeles")
        request = self.factory.get("/")

        with self.assertNumQueries(0):
            active_timezone = self.call_middleware(request)

        assert active_timezone == settings.TIME_ZONE


class SiteConfigurationAdminTest(TestCase):
    """The site timezone is exposed as a singleton in Django admin."""

    def setUp(self) -> None:
        self.model_admin = SiteConfigurationAdmin(SiteConfiguration, admin.site)
        self.request = RequestFactory().get("/admin/core/siteconfiguration/")
        self.request.user = User.objects.create_superuser(username="site-admin")

    def test_timezone_choices_include_common_iana_zones(self) -> None:
        form_class = self.model_admin.get_form(self.request)
        timezone_names = {
            choice[0] for choice in form_class.base_fields["timezone"].choices
        }

        assert "UTC" in timezone_names
        assert "America/New_York" in timezone_names

    def test_site_configuration_is_registered(self) -> None:
        assert isinstance(
            admin.site._registry[SiteConfiguration],
            SiteConfigurationAdmin,
        )

    def test_initial_configuration_can_be_added(self) -> None:
        assert self.model_admin.has_add_permission(self.request) is True

    def test_second_configuration_cannot_be_added(self) -> None:
        SiteConfiguration.objects.create()

        assert self.model_admin.has_add_permission(self.request) is False

    def test_configuration_cannot_be_deleted(self) -> None:
        configuration = SiteConfiguration.objects.create()

        assert (
            self.model_admin.has_delete_permission(self.request, configuration) is False
        )
