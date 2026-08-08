"""The help guide is readable by signed-in staff and by nobody else."""

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from coalition.admin_help.pages import HELP_PAGES

from .support import without_static_manifest

TEST_PASSWORD = "guide-tests-only"  # noqa: S105


@without_static_manifest
class HelpGuideAccessTest(TestCase):
    """Every help URL sits behind the same gate as the rest of the admin."""

    @classmethod
    def setUpTestData(cls) -> None:
        cls.staff = User.objects.create_user(
            username="intern",
            password=TEST_PASSWORD,
            is_staff=True,
        )
        cls.visitor = User.objects.create_user(
            username="subscriber",
            password=TEST_PASSWORD,
            is_staff=False,
        )

    def help_urls(self) -> list[str]:
        return [
            reverse("admin_help:index"),
            reverse("admin_help:all"),
            *[reverse("admin_help:page", args=[page.slug]) for page in HELP_PAGES],
        ]

    def test_anonymous_visitors_are_sent_to_the_admin_login(self) -> None:
        for url in self.help_urls():
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertRedirects(
                    response,
                    f"{reverse('admin:login')}?next={url}",
                    fetch_redirect_response=False,
                )

    def test_signed_in_non_staff_users_are_sent_to_the_admin_login(self) -> None:
        self.client.force_login(self.visitor)

        for url in self.help_urls():
            with self.subTest(url=url):
                response = self.client.get(url)
                assert response.status_code == 302
                assert reverse("admin:login") in response["Location"]

    def test_deactivated_staff_accounts_are_sent_to_the_admin_login(self) -> None:
        self.staff.is_active = False
        self.staff.save(update_fields=["is_active"])
        self.client.force_login(self.staff)

        response = self.client.get(reverse("admin_help:index"))

        assert response.status_code == 302

    def test_staff_can_read_every_page(self) -> None:
        self.client.force_login(self.staff)

        for url in self.help_urls():
            with self.subTest(url=url):
                response = self.client.get(url)
                assert response.status_code == 200

    def test_unknown_slugs_are_not_found(self) -> None:
        self.client.force_login(self.staff)

        response = self.client.get("/admin/help/no-such-page/")

        assert response.status_code == 404

    def test_slugs_resolve_against_the_registry_not_the_filesystem(self) -> None:
        """A traversal-shaped or extension-bearing slug never reaches a file read."""
        self.client.force_login(self.staff)

        for slug in ("..%2Fsettings", "....//settings", "start-here.md"):
            with self.subTest(slug=slug):
                response = self.client.get(f"/admin/help/{slug}/")
                assert response.status_code == 404
