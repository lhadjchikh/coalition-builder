"""Access-control tests for stakeholder API data."""

from django.contrib.auth.models import User
from django.test import TestCase


class StakeholderAPIAccessTest(TestCase):
    def test_anonymous_users_cannot_list_stakeholders(self) -> None:
        response = self.client.get("/api/stakeholders/")

        assert response.status_code == 403

    def test_staff_can_list_stakeholders(self) -> None:
        staff = User.objects.create_user(username="staff", is_staff=True)
        self.client.force_login(staff)

        response = self.client.get("/api/stakeholders/")

        assert response.status_code == 200
