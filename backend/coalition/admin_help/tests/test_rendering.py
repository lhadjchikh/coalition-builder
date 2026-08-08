"""Markdown source is rendered as a Django template first, then converted to HTML."""

from django.test import TestCase, override_settings

from coalition.admin_help import renderer
from coalition.admin_help.pages import HelpPage
from coalition.admin_help.renderer import (
    DEFAULT_SUPERVISOR_CONTACT,
    DEFAULT_TECHNICAL_CONTACT,
    deployment_context,
    render_source,
)


class DeploymentContextTest(TestCase):
    """Contacts and organization names come from settings, never from the prose."""

    @override_settings(
        ORGANIZATION_NAME="Land and Bay Stewards",
        ADMIN_HELP_SUPERVISOR_CONTACT="Ada Lovelace (ada@example.org)",
        ADMIN_HELP_TECHNICAL_CONTACT="support@example.org",
    )
    def test_configured_contacts_are_used(self) -> None:
        context = deployment_context()

        assert context["organization_name"] == "Land and Bay Stewards"
        assert context["supervisor_contact"] == "Ada Lovelace (ada@example.org)"
        assert context["technical_contact"] == "support@example.org"

    @override_settings(
        ADMIN_HELP_SUPERVISOR_CONTACT="",
        ADMIN_HELP_TECHNICAL_CONTACT="",
    )
    def test_unset_contacts_fall_back_to_neutral_wording(self) -> None:
        context = deployment_context()

        assert context["supervisor_contact"] == DEFAULT_SUPERVISOR_CONTACT
        assert context["technical_contact"] == DEFAULT_TECHNICAL_CONTACT


class SourceRenderingTest(TestCase):
    """The two-stage render is what makes deep links and org names maintainable."""

    @override_settings(ORGANIZATION_NAME="Land and Bay Stewards")
    def test_template_variables_are_substituted_before_markdown_runs(self) -> None:
        html = render_source("We work for **{{ organization_name }}**.").html

        assert "<strong>Land and Bay Stewards</strong>" in html

    def test_admin_urls_are_resolved_by_django_rather_than_hand_typed(self) -> None:
        html = render_source(
            "[Queue]({% url 'admin:endorsements_endorsement_changelist' %})",
        ).html

        assert 'href="/admin/endorsements/endorsement/"' in html

    def test_tables_and_task_lists_survive_conversion(self) -> None:
        html = render_source("| A | B |\n|---|---|\n| 1 | 2 |").html

        assert "<table>" in html

    def test_headings_get_anchors_for_the_table_of_contents(self) -> None:
        rendered = render_source("## Reviewing endorsements")

        assert 'id="reviewing-endorsements"' in rendered.html
        assert "#reviewing-endorsements" in rendered.toc

    def test_template_values_cannot_create_javascript_links(self) -> None:
        rendered = render_source(
            "Ask {{ supervisor_contact }}.",
            {"supervisor_contact": "[Support](javascript:alert(1))"},
        )

        assert "Support" in rendered.html
        assert "javascript:" not in rendered.html

    def test_template_values_cannot_add_event_handlers(self) -> None:
        rendered = render_source(
            "{{ supervisor_contact }}",
            {"supervisor_contact": "![Support](missing){onerror=alert(1)}"},
        )

        assert "onerror" not in rendered.html


class RenderCacheTest(TestCase):
    """Rendered HTML is cached per deployment context, and bypassed while debugging."""

    def setUp(self) -> None:
        super().setUp()
        renderer.clear_cache()
        self.addCleanup(renderer.clear_cache)
        self.page = HelpPage(
            slug="start-here",
            title="Start here",
            blurb="Test fixture reusing a real content file.",
        )

    @override_settings(DEBUG=False)
    def test_a_page_is_converted_once_per_deployment_context(self) -> None:
        first = renderer.render(self.page)
        second = renderer.render(self.page)

        assert first is second

    @override_settings(DEBUG=False)
    def test_changing_a_contact_setting_produces_freshly_rendered_html(self) -> None:
        with override_settings(ADMIN_HELP_SUPERVISOR_CONTACT="First Contact"):
            first = renderer.render(self.page)
        with override_settings(ADMIN_HELP_SUPERVISOR_CONTACT="Second Contact"):
            second = renderer.render(self.page)

        assert first is not second

    @override_settings(DEBUG=True)
    def test_content_is_re_read_while_debugging_so_edits_show_up(self) -> None:
        first = renderer.render(self.page)
        second = renderer.render(self.page)

        assert first is not second
