"""Tests for the staff-facing person admin."""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

from coalition.content.admin.person import PersonAdmin
from coalition.content.models import Person, PersonGroup
from coalition.test_base import BaseTestCase

User = get_user_model()


class PersonAdminTest(BaseTestCase):
    """Person administration exposes ordering and protects standard permissions."""

    def setUp(self) -> None:
        super().setUp()
        self.admin = PersonAdmin(Person, AdminSite())
        self.group = PersonGroup.objects.create(name="Staff")

    def test_configures_list_display_filters_and_fieldsets(self) -> None:
        assert self.admin.list_display == (
            "name",
            "title",
            "group",
            "order",
            "is_active",
            "profile_page_enabled",
            "has_headshot",
        )
        assert self.admin.list_filter == (
            "group",
            "is_active",
            "profile_page_enabled",
        )
        assert self.admin.list_editable == (
            "order",
            "is_active",
            "profile_page_enabled",
        )
        assert self.admin.readonly_fields == ("slug", "created_at", "updated_at")
        assert len(self.admin.fieldsets) == 4

    def test_reports_whether_person_has_a_headshot(self) -> None:
        person = Person.objects.create(
            group=self.group,
            name="Jane Doe",
            title="Director",
        )

        assert self.admin.has_headshot(person) is False

    def test_user_without_model_permissions_cannot_open_write_views(self) -> None:
        user = User.objects.create_user(
            username="restricted-staff",
            password="admin-test-password",  # noqa: S106
            is_staff=True,
        )
        person = Person.objects.create(
            group=self.group,
            name="Jane Doe",
            title="Director",
        )
        client = Client()
        client.force_login(user)

        protected_urls = (
            reverse("admin:content_person_add"),
            reverse("admin:content_person_change", args=[person.pk]),
            reverse("admin:content_person_delete", args=[person.pk]),
        )
        for url in protected_urls:
            with self.subTest(url=url):
                response = client.get(url)
                assert response.status_code == 403
