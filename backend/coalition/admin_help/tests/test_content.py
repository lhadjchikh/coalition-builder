"""The guide's content stays in step with its registry, and its links keep working."""

import re

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import Resolver404, resolve, reverse

from coalition.admin_help.pages import HELP_PAGES, get_page, neighbors
from coalition.admin_help.renderer import CONTENT_DIR, render

from .support import without_static_manifest

TEST_PASSWORD = "guide-tests-only"  # noqa: S105

ADMIN_HREF = re.compile(r'href="(/admin/[^"#?]*)')


class HelpRegistryTest(TestCase):
    """`pages.py` and `content/` describe the same set of pages."""

    def test_every_registered_page_has_a_markdown_file(self) -> None:
        missing = [
            page.slug
            for page in HELP_PAGES
            if not (CONTENT_DIR / f"{page.slug}.md").is_file()
        ]

        assert missing == [], f"Registered pages with no content file: {missing}"

    def test_every_markdown_file_is_registered(self) -> None:
        registered = {page.slug for page in HELP_PAGES}
        orphans = sorted(
            path.stem
            for path in CONTENT_DIR.glob("*.md")
            if path.stem not in registered
        )

        assert orphans == [], f"Content files missing from the registry: {orphans}"

    def test_slugs_and_titles_are_unique(self) -> None:
        slugs = [page.slug for page in HELP_PAGES]
        titles = [page.title for page in HELP_PAGES]

        assert len(set(slugs)) == len(slugs)
        assert len(set(titles)) == len(titles)

    def test_get_page_returns_none_for_an_unregistered_slug(self) -> None:
        assert get_page("not-a-page") is None

    def test_neighbors_bound_the_first_and_last_pages(self) -> None:
        first_previous, first_next = neighbors(HELP_PAGES[0])
        last_previous, last_next = neighbors(HELP_PAGES[-1])

        assert first_previous is None
        assert first_next == HELP_PAGES[1]
        assert last_previous == HELP_PAGES[-2]
        assert last_next is None

    def test_team_help_covers_the_complete_publication_workflow(self) -> None:
        page = get_page("team")

        assert page is not None
        source = (CONTENT_DIR / "team.md").read_text()
        for required_guidance in (
            "create a group",
            "add a person",
            "800 × 800",
            "square",
            "hiding a group",
            "/team",
            "our team",
            "profile page",
            "next public request",
        ):
            with self.subTest(required_guidance=required_guidance):
                assert required_guidance in source.lower()


@without_static_manifest
class HelpContentTest(TestCase):
    """Every page renders, and the links it points at exist."""

    @classmethod
    def setUpTestData(cls) -> None:
        cls.staff = User.objects.create_user(
            username="intern",
            password=TEST_PASSWORD,
            is_staff=True,
        )

    def test_every_page_renders_to_non_empty_html(self) -> None:
        for page in HELP_PAGES:
            with self.subTest(slug=page.slug):
                rendered = render(page)
                assert "<" in rendered.html
                assert len(rendered.html) > 200

    def test_no_page_leaks_an_unrendered_template_tag(self) -> None:
        for page in HELP_PAGES:
            with self.subTest(slug=page.slug):
                rendered = render(page)
                assert "{{" not in rendered.html
                assert "{%" not in rendered.html

    def test_every_admin_link_in_the_guide_resolves(self) -> None:
        """Deep links into the admin are the part of the guide most likely to rot."""
        self.client.force_login(self.staff)
        checked = 0

        for page in HELP_PAGES:
            response = self.client.get(reverse("admin_help:page", args=[page.slug]))
            body = response.content.decode()
            for href in set(ADMIN_HREF.findall(body)):
                checked += 1
                with self.subTest(slug=page.slug, href=href):
                    try:
                        resolve(href)
                    except Resolver404:  # pragma: no cover - failure path
                        self.fail(f"{page.slug} links to unresolvable admin URL {href}")

        # Guards against the regex silently matching nothing and the test passing
        # while every link in the guide is broken.
        assert checked > len(HELP_PAGES), f"Only found {checked} admin links to check"

    def test_a_page_is_headed_by_its_own_title_not_the_guide_name(self) -> None:
        self.client.force_login(self.staff)
        page = HELP_PAGES[6]

        body = self.client.get(
            reverse("admin_help:page", args=[page.slug]),
        ).content.decode()

        assert f"<h1>{page.title}</h1>" in body
        assert "<h2>Admin guide</h2>" not in body

    def test_the_printable_view_contains_every_page(self) -> None:
        self.client.force_login(self.staff)

        body = self.client.get(reverse("admin_help:all")).content.decode()

        assert body.count('<section class="admin-help__section">') == len(HELP_PAGES)
        for page in HELP_PAGES:
            with self.subTest(slug=page.slug):
                assert f'<h2 id="{page.slug}">{page.title}</h2>' in body
                assert str(render(page).html) in body

    def test_each_page_offers_navigation_to_the_rest_of_the_guide(self) -> None:
        self.client.force_login(self.staff)

        body = self.client.get(
            reverse("admin_help:page", args=[HELP_PAGES[0].slug]),
        ).content.decode()

        for page in HELP_PAGES[1:]:
            with self.subTest(slug=page.slug):
                assert reverse("admin_help:page", args=[page.slug]) in body
