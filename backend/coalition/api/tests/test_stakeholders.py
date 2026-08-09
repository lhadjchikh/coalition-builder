"""Access-control tests for stakeholder API data."""

from django.contrib.auth.models import Permission, User
from django.test import TestCase


class StakeholderAPIAccessTest(TestCase):
    def test_anonymous_users_cannot_list_stakeholders(self) -> None:
        response = self.client.get("/api/stakeholders/")

        assert response.status_code == 403

    def test_staff_without_view_permission_cannot_list_stakeholders(self) -> None:
        staff = User.objects.create_user(username="staff", is_staff=True)
        self.client.force_login(staff)

        response = self.client.get("/api/stakeholders/")

        assert response.status_code == 403

    def test_staff_with_view_permission_can_list_stakeholders(self) -> None:
        staff = User.objects.create_user(username="stakeholder-viewer", is_staff=True)
        view_permission = Permission.objects.get(
            codename="view_stakeholder",
            content_type__app_label="stakeholders",
        )
        staff.user_permissions.add(view_permission)
        self.client.force_login(staff)

        response = self.client.get("/api/stakeholders/")

        assert response.status_code == 200
