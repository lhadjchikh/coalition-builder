"""Tests for team-group administration and protected deletion guidance."""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

from coalition.admin_help.tests.support import without_static_manifest
from coalition.content.admin.person_group import PersonGroupAdmin, PersonInline
from coalition.content.models import Person, PersonGroup
from coalition.test_base import BaseTestCase

User = get_user_model()


@without_static_manifest
class PersonGroupAdminTest(BaseTestCase):
    """Group administration keeps people reorderable and deletion understandable."""

    def setUp(self) -> None:
        super().setUp()
        self.admin = PersonGroupAdmin(PersonGroup, AdminSite())
        self.superuser = User.objects.create_superuser(
            username="team-admin",
            email="team-admin@example.com",
            password="admin-test-password",  # noqa: S106
        )
        self.client.force_login(self.superuser)

    def test_configures_group_list_and_person_inline(self) -> None:
        assert self.admin.list_display == (
            "name",
            "order",
            "is_visible",
            "person_count",
        )
        assert self.admin.list_filter == ("is_visible",)
        assert self.admin.list_editable == ("order", "is_visible")
        assert self.admin.readonly_fields == ("slug",)
        assert self.admin.inlines == (PersonInline,)
        assert PersonInline.model is Person
        assert PersonInline.fields == (
            "name",
            "title",
            "order",
            "is_active",
        )

    def test_populated_group_delete_page_explains_remediation(self) -> None:
        group = PersonGroup.objects.create(name="Board")
        Person.objects.create(group=group, name="Jane Doe", title="Chair")

        response = self.client.get(
            reverse("admin:content_persongroup_delete", args=[group.pk]),
        )
        body = response.content.decode()

        assert response.status_code == 200
        assert "Board" in body
        assert "people are still assigned" in body
        assert "reassign or delete" in body

    def test_populated_group_is_not_deleted_after_confirmation(self) -> None:
        group = PersonGroup.objects.create(name="Board")
        Person.objects.create(group=group, name="Jane Doe", title="Chair")

        response = self.client.post(
            reverse("admin:content_persongroup_delete", args=[group.pk]),
            {"post": "yes"},
        )

        assert response.status_code == 200
        assert PersonGroup.objects.filter(pk=group.pk).exists()

    def test_empty_group_can_be_deleted(self) -> None:
        group = PersonGroup.objects.create(name="Former Committee")

        response = self.client.post(
            reverse("admin:content_persongroup_delete", args=[group.pk]),
            {"post": "yes"},
        )

        assert response.status_code == 302
        assert not PersonGroup.objects.filter(pk=group.pk).exists()

    def test_user_without_model_permissions_cannot_open_write_views(self) -> None:
        user = User.objects.create_user(
            username="restricted-team-staff",
            password="admin-test-password",  # noqa: S106
            is_staff=True,
        )
        group = PersonGroup.objects.create(name="Staff")
        client = Client()
        client.force_login(user)

        protected_urls = (
            reverse("admin:content_persongroup_add"),
            reverse("admin:content_persongroup_change", args=[group.pk]),
            reverse("admin:content_persongroup_delete", args=[group.pk]),
        )
        for url in protected_urls:
            with self.subTest(url=url):
                response = client.get(url)
                assert response.status_code == 403

    def test_inline_reordering_is_reflected_by_the_people_api(self) -> None:
        group = PersonGroup.objects.create(name="Staff")
        first = Person.objects.create(
            group=group,
            name="First Person",
            title="Director",
            order=1,
        )
        second = Person.objects.create(
            group=group,
            name="Second Person",
            title="Advisor",
            order=2,
        )

        response = self.client.post(
            reverse("admin:content_persongroup_change", args=[group.pk]),
            {
                "name": group.name,
                "description": group.description,
                "order": group.order,
                "is_visible": "on",
                "people-TOTAL_FORMS": "2",
                "people-INITIAL_FORMS": "2",
                "people-MIN_NUM_FORMS": "0",
                "people-MAX_NUM_FORMS": "1000",
                "people-0-id": str(first.pk),
                "people-0-name": first.name,
                "people-0-title": first.title,
                "people-0-order": "2",
                "people-0-is_active": "on",
                "people-1-id": str(second.pk),
                "people-1-name": second.name,
                "people-1-title": second.title,
                "people-1-order": "1",
                "people-1-is_active": "on",
                "_save": "Save",
            },
        )

        assert response.status_code == 302
        people_response = self.client.get("/api/people/")
        assert [person["name"] for person in people_response.json()[0]["people"]] == [
            "Second Person",
            "First Person",
        ]

    def test_duplicate_group_name_is_a_field_error(self) -> None:
        PersonGroup.objects.create(name="Staff")

        response = self.client.post(
            reverse("admin:content_persongroup_add"),
            {
                "name": "Staff",
                "description": "",
                "order": "0",
                "is_visible": "on",
                "people-TOTAL_FORMS": "0",
                "people-INITIAL_FORMS": "0",
                "people-MIN_NUM_FORMS": "0",
                "people-MAX_NUM_FORMS": "1000",
                "_save": "Save",
            },
        )

        assert response.status_code == 200
        form = response.context["adminform"].form
        assert "name" in form.errors
        assert "already exists" in form.errors["name"][0]
        assert PersonGroup.objects.filter(name="Staff").count() == 1
