"""
Tests for the display_publicly field and admin display selection functionality.
"""

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.test_base import BaseTestCase


class DisplayPubliclyTest(BaseTestCase):
    """Test the display_publicly field functionality"""

    def setUp(self) -> None:
        super().setUp()
        # Create test campaign
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test campaign summary",
            allow_endorsements=True,
        )

        # Create test stakeholder
        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="Doe",
            email="john@example.com",
            street_address="123 Main St",
            city="Anytown",
            state=self.california,  # Use Region object from fixture
            zip_code="12345",
            type="individual",
        )

        # Create test endorsement
        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="I support this campaign",
            public_display=True,
            status="approved",
            email_verified=True,
            terms_accepted=True,
        )

    def test_display_publicly_default(self) -> None:
        """Test that display_publicly defaults to False"""
        endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=PolicyCampaign.objects.create(
                name="another-campaign",
                title="Another Campaign",
                allow_endorsements=True,
            ),
        )
        assert endorsement.display_publicly is False

    def test_should_display_publicly_all_conditions(self) -> None:
        """Test should_display_publicly property with all conditions"""
        # Initially display_publicly is False
        assert self.endorsement.should_display_publicly is False

        # Set display_publicly to True
        self.endorsement.display_publicly = True
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is True

        # Test with public_display = False
        self.endorsement.public_display = False
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is False

        # Test with email_verified = False
        self.endorsement.public_display = True
        self.endorsement.email_verified = False
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is False

        # Test with status != approved
        self.endorsement.email_verified = True
        self.endorsement.status = "pending"
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is False

        # Test with display_publicly = False
        self.endorsement.status = "approved"
        self.endorsement.display_publicly = False
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is False

    def test_only_all_conditions_met_shows_publicly(self) -> None:
        """Test that all conditions must be met for public display"""
        conditions = {
            "public_display": True,
            "email_verified": True,
            "status": "approved",
            "display_publicly": True,
        }

        # Test each condition being False while others are True
        for field, _value in conditions.items():
            # Reset all to True
            for f, v in conditions.items():
                setattr(self.endorsement, f, v)

            # Set one condition to False/different value
            if field == "status":
                setattr(self.endorsement, field, "pending")
            else:
                setattr(self.endorsement, field, False)

            self.endorsement.save()
            assert (
                self.endorsement.should_display_publicly is False
            ), f"should_display_publicly should be False when {field} is not met"

        # All conditions met
        for field, value in conditions.items():
            setattr(self.endorsement, field, value)
        self.endorsement.save()
        assert self.endorsement.should_display_publicly is True
