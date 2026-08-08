"""The guide is reachable from the admin screens it describes."""

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from coalition.admin_help.admin_links import HelpLinkAdminMixin
from coalition.campaigns.admin import BillAdmin, PolicyCampaignAdmin
from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.admin import EndorsementAdmin
from coalition.endorsements.models import Endorsement
from coalition.test_base import BaseTestCase

from .support import without_static_manifest

TEST_PASSWORD = "guide-tests-only"  # noqa: S105


@without_static_manifest
class HelpHeaderLinkTest(TestCase):
    """Staff can reach the guide from any admin page, not just the ones we annotate."""

    @classmethod
    def setUpTestData(cls) -> None:
        cls.staff = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password=TEST_PASSWORD,
        )

    def test_the_admin_header_links_to_the_guide(self) -> None:
        self.client.force_login(self.staff)

        body = self.client.get(reverse("admin:index")).content.decode()

        assert reverse("admin_help:index") in body

    def test_the_overridden_base_template_keeps_the_site_branding(self) -> None:
        """Our base_site.html copy must not drop what Django's version provides."""
        self.client.force_login(self.staff)

        body = self.client.get(reverse("admin:index")).content.decode()

        assert 'id="site-name"' in body
        assert reverse("admin:password_change") in body


@without_static_manifest
class ContextualHelpLinkTest(BaseTestCase):
    """Each annotated ModelAdmin points at the page documenting that screen."""

    def setUp(self) -> None:
        super().setUp()
        self.staff = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password=TEST_PASSWORD,
        )
        self.client.force_login(self.staff)
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
        )
        self.endorsement = Endorsement.objects.create(
            stakeholder=self.create_stakeholder(),
            campaign=self.campaign,
        )

    def test_the_annotated_admins_declare_a_registered_help_page(self) -> None:
        for admin_class in (EndorsementAdmin, PolicyCampaignAdmin, BillAdmin):
            with self.subTest(admin=admin_class.__name__):
                assert issubclass(admin_class, HelpLinkAdminMixin)
                assert admin_class.help_page_slug

    def test_the_endorsement_queue_links_to_the_reviewing_page(self) -> None:
        url = reverse("admin:endorsements_endorsement_changelist")

        body = self.client.get(url).content.decode()

        assert reverse("admin_help:page", args=["reviewing-endorsements"]) in body

    def test_an_endorsement_detail_page_links_to_the_reviewing_page(self) -> None:
        url = reverse(
            "admin:endorsements_endorsement_change",
            args=[self.endorsement.pk],
        )

        body = self.client.get(url).content.decode()

        assert reverse("admin_help:page", args=["reviewing-endorsements"]) in body

    def test_the_campaign_form_links_to_the_campaign_page(self) -> None:
        url = reverse("admin:campaigns_policycampaign_add")

        body = self.client.get(url).content.decode()

        assert reverse("admin_help:page", args=["campaigns"]) in body

    def test_annotating_an_admin_does_not_break_its_own_template(self) -> None:
        """The overrides extend Django's templates rather than replacing them."""
        url = reverse("admin:endorsements_endorsement_changelist")

        response = self.client.get(url)

        assert response.status_code == 200
        assert "result_list" in response.content.decode()
