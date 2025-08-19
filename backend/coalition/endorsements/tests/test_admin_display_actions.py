"""
Tests for admin actions related to display_publicly functionality.
"""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.admin import EndorsementAdmin
from coalition.endorsements.models import Endorsement
from coalition.test_base import BaseTestCase


class MockRequest:
    """Mock request for admin actions"""

    def __init__(self, user: User) -> None:
        self.user = user
        self._messages = []

    def _get_messages(self) -> list:
        return self._messages


class AdminDisplayActionsTest(BaseTestCase):
    """Test admin actions for display_publicly management"""

    def setUp(self) -> None:
        super().setUp()
        self.site = AdminSite()
        self.admin = EndorsementAdmin(Endorsement, self.site)

        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        # Create test campaign
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            allow_endorsements=True,
        )

        # Create test stakeholders and endorsements
        self.endorsements = []
        for i in range(5):
            stakeholder = self.create_stakeholder(
                first_name=f"User{i}",
                last_name="Test",
                email=f"user{i}@example.com",
                street_address="123 Main St",
                city="Anytown",
                state=self.california,  # Use Region object from fixture
                zip_code="12345",
                type="individual",
            )

            endorsement = Endorsement.objects.create(
                stakeholder=stakeholder,
                campaign=self.campaign,
                statement=f"Statement {i}",
                public_display=True,
                status="approved" if i < 3 else "pending",
                email_verified=True,
                display_publicly=False,
            )
            self.endorsements.append(endorsement)

    def test_approve_for_display_action(self) -> None:
        """Test approve_for_display admin action"""
        request = MockRequest(self.admin_user)
        queryset = Endorsement.objects.filter(
            id__in=[e.id for e in self.endorsements[:3]],
        )

        # Mock message_user
        messages = []
        self.admin.message_user = lambda _req, msg: messages.append(msg)

        # Run the action
        self.admin.approve_for_display(request, queryset)

        # Check that only approved endorsements were updated
        for _i, endorsement in enumerate(self.endorsements[:3]):
            endorsement.refresh_from_db()
            assert endorsement.display_publicly is True

        # Check that non-approved endorsements were not updated
        for endorsement in self.endorsements[3:]:
            endorsement.refresh_from_db()
            assert endorsement.display_publicly is False

        # Check success message
        assert len(messages) == 1
        assert "Successfully approved 3 endorsement(s)" in messages[0]

    def test_approve_for_display_filters_conditions(self) -> None:
        """Test approve_for_display only affects endorsements meeting all conditions"""
        # Create endorsements with different conditions
        test_endorsements = []

        # Missing email_verified
        e1 = Endorsement.objects.create(
            stakeholder=self.endorsements[0].stakeholder,
            campaign=PolicyCampaign.objects.create(
                name="c1",
                title="C1",
                allow_endorsements=True,
            ),
            public_display=True,
            status="approved",
            email_verified=False,
        )
        test_endorsements.append(e1)

        # Missing public_display
        e2 = Endorsement.objects.create(
            stakeholder=self.endorsements[1].stakeholder,
            campaign=PolicyCampaign.objects.create(
                name="c2",
                title="C2",
                allow_endorsements=True,
            ),
            public_display=False,
            status="approved",
            email_verified=True,
        )
        test_endorsements.append(e2)

        # All conditions met
        e3 = Endorsement.objects.create(
            stakeholder=self.endorsements[2].stakeholder,
            campaign=PolicyCampaign.objects.create(
                name="c3",
                title="C3",
                allow_endorsements=True,
            ),
            public_display=True,
            status="approved",
            email_verified=True,
        )
        test_endorsements.append(e3)

        request = MockRequest(self.admin_user)
        queryset = Endorsement.objects.filter(id__in=[e.id for e in test_endorsements])

        # Mock message_user
        messages = []
        self.admin.message_user = lambda _req, msg: messages.append(msg)

        # Run the action
        self.admin.approve_for_display(request, queryset)

        # Only e3 should be updated
        e1.refresh_from_db()
        e2.refresh_from_db()
        e3.refresh_from_db()

        assert e1.display_publicly is False
        assert e2.display_publicly is False
        assert e3.display_publicly is True

        # Check message
        assert "Successfully approved 1 endorsement(s)" in messages[0]

    def test_remove_from_display_action(self) -> None:
        """Test remove_from_display admin action"""
        # Set some endorsements to display_publicly=True
        for endorsement in self.endorsements[:3]:
            endorsement.display_publicly = True
            endorsement.save()

        request = MockRequest(self.admin_user)
        queryset = Endorsement.objects.filter(
            id__in=[e.id for e in self.endorsements[:2]],
        )

        # Mock message_user
        messages = []
        self.admin.message_user = lambda _req, msg: messages.append(msg)

        # Run the action
        self.admin.remove_from_display(request, queryset)

        # Check that selected endorsements were updated
        self.endorsements[0].refresh_from_db()
        self.endorsements[1].refresh_from_db()
        self.endorsements[2].refresh_from_db()

        assert self.endorsements[0].display_publicly is False
        assert self.endorsements[1].display_publicly is False
        assert self.endorsements[2].display_publicly is True  # Not in queryset

        # Check success message
        assert "Successfully removed 2 endorsement(s)" in messages[0]

    def test_admin_list_display_includes_display_publicly(self) -> None:
        """Test that admin list_display includes display_publicly"""
        assert "display_publicly" in self.admin.list_display

    def test_admin_list_filter_includes_display_publicly(self) -> None:
        """Test that admin list_filter includes display_publicly"""
        assert "display_publicly" in self.admin.list_filter

    def test_admin_fieldsets_include_display_publicly(self) -> None:
        """Test that admin fieldsets include display_publicly in Admin Review section"""
        # Find the Admin Review fieldset
        admin_review_fieldset = None
        for name, fieldset in self.admin.fieldsets:
            if name == "Admin Review":
                admin_review_fieldset = fieldset
                break

        assert admin_review_fieldset is not None
        assert "display_publicly" in admin_review_fieldset["fields"]

    def test_admin_actions_registered(self) -> None:
        """Test that new admin actions are registered"""
        assert "approve_for_display" in self.admin.actions
        assert "remove_from_display" in self.admin.actions
