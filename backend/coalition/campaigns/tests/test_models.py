from django.core.exceptions import ValidationError
from django.test import TestCase

from coalition.endorsements.models import Endorsement
from coalition.legislators.models import Legislator
from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder

from ..models import Bill, PolicyCampaign


class PolicyCampaignModelTest(TestCase):
    """Test the PolicyCampaign model including endorsement fields"""

    def setUp(self) -> None:
        self.campaign_data = {
            "name": "clean-water-protection",
            "title": "Clean Water Protection Act",
            "summary": "Protecting our waterways for future generations",
            "description": "A comprehensive bill to strengthen water quality standards",
            "endorsement_statement": (
                "I support the Clean Water Protection Act and its goal of "
                "ensuring safe, clean water for all communities"
            ),
            "allow_endorsements": True,
            "endorsement_form_instructions": (
                "Please provide your organization details and any additional "
                "comments about why you support this legislation"
            ),
        }

    def test_create_campaign_with_endorsement_fields(self) -> None:
        """Test creating a campaign with all endorsement-related fields"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)

        assert campaign.name == "clean-water-protection"
        assert campaign.title == "Clean Water Protection Act"
        assert campaign.summary == "Protecting our waterways for future generations"
        assert campaign.description == (
            "A comprehensive bill to strengthen water quality standards"
        )
        assert campaign.endorsement_statement == (
            "I support the Clean Water Protection Act and its goal of "
            "ensuring safe, clean water for all communities"
        )
        assert campaign.allow_endorsements
        assert campaign.endorsement_form_instructions == (
            "Please provide your organization details and any additional "
            "comments about why you support this legislation"
        )
        assert campaign.active  # Default value
        assert campaign.created_at is not None

    def test_campaign_endorsement_defaults(self) -> None:
        """Test default values for endorsement fields"""
        minimal_data = {
            "name": "test-campaign",
            "title": "Test Campaign",
            "summary": "A test campaign",
        }
        campaign = PolicyCampaign.objects.create(**minimal_data)

        assert campaign.description == ""
        assert campaign.endorsement_statement == ""
        assert campaign.allow_endorsements  # Default True
        assert campaign.endorsement_form_instructions == ""

    def test_campaign_str_representation(self) -> None:
        """Test string representation of campaign"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)
        assert str(campaign) == "Clean Water Protection Act"

    def test_allow_endorsements_toggle(self) -> None:
        """Test toggling the allow_endorsements field"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)
        assert campaign.allow_endorsements

        # Disable endorsements
        campaign.allow_endorsements = False
        campaign.save()

        campaign.refresh_from_db()
        assert not campaign.allow_endorsements

    def test_campaign_with_endorsements_relationship(self) -> None:
        """Test that campaign can access its endorsements"""
        campaign = PolicyCampaign.objects.create(**self.campaign_data)

        # Create stakeholder and endorsement
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="Supporter",
            organization="Test Organization",
            email="supporter@test.org",
            state="MD",
            type="nonprofit",
        )

        endorsement = Endorsement.objects.create(
            stakeholder=stakeholder,
            campaign=campaign,
            statement="We fully support this important legislation",
            public_display=True,
        )

        # Test reverse relationship
        campaign_endorsements = campaign.endorsements.all()
        assert campaign_endorsements.count() == 1
        assert campaign_endorsements.first() == endorsement


class BillModelTest(TestCase):
    """Test the Bill model for both federal and state bills"""

    def setUp(self) -> None:
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign for bills",
        )

        # Create a test state region
        self.california = Region.objects.create(
            name="California",
            type="state",
            geoid="06",
        )

    def test_create_federal_bill(self) -> None:
        """Test creating a federal bill"""
        bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="123",
            title="Federal Clean Energy Act",
            chamber="house",
            session="119",
            introduced_date="2023-01-15",
        )

        assert bill.level == "federal"
        assert bill.number == "123"
        assert bill.title == "Federal Clean Energy Act"
        assert bill.chamber == "house"
        assert bill.session == "119"
        assert bill.state is None
        assert str(bill) == "H.R. 123"

    def test_create_state_bill(self) -> None:
        """Test creating a state bill"""
        bill = Bill.objects.create(
            level="state",
            policy=self.campaign,
            number="456",
            title="California Clean Energy Act",
            chamber="assembly",
            session="2023-2024",
            state=self.california,
            introduced_date="2023-02-15",
        )

        assert bill.level == "state"
        assert bill.number == "456"
        assert bill.title == "California Clean Energy Act"
        assert bill.chamber == "assembly"
        assert bill.session == "2023-2024"
        assert bill.state == self.california
        assert str(bill) == "California AB 456"

    def test_bill_str_representations(self) -> None:
        """Test string representations for different chamber types"""
        # Federal House bill
        house_bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="100",
            title="House Bill",
            chamber="house",
            session="119",
            introduced_date="2023-01-01",
        )
        assert str(house_bill) == "H.R. 100"

        # Federal Senate bill
        senate_bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="200",
            title="Senate Bill",
            chamber="senate",
            session="119",
            introduced_date="2023-01-01",
        )
        assert str(senate_bill) == "S. 200"

        # State Assembly bill
        assembly_bill = Bill.objects.create(
            level="state",
            policy=self.campaign,
            number="300",
            title="Assembly Bill",
            chamber="assembly",
            session="2023",
            state=self.california,
            introduced_date="2023-01-01",
        )
        assert str(assembly_bill) == "California AB 300"

        # State Senate bill
        state_senate_bill = Bill.objects.create(
            level="state",
            policy=self.campaign,
            number="400",
            title="State Senate Bill",
            chamber="state_senate",
            session="2023",
            state=self.california,
            introduced_date="2023-01-01",
        )
        assert str(state_senate_bill) == "California SB 400"

    def test_bill_validation_federal_without_state(self) -> None:
        """Test that federal bills cannot have a state"""
        bill = Bill(
            level="federal",
            policy=self.campaign,
            number="123",
            title="Federal Bill",
            chamber="house",
            session="119",
            state=self.california,  # This should be invalid
            introduced_date="2023-01-01",
        )

        with self.assertRaises(ValidationError):
            bill.clean()

    def test_bill_validation_state_requires_state(self) -> None:
        """Test that state bills must have a state"""
        bill = Bill(
            level="state",
            policy=self.campaign,
            number="123",
            title="State Bill",
            chamber="assembly",
            session="2023",
            # Missing state field
            introduced_date="2023-01-01",
        )

        with self.assertRaises(ValidationError):
            bill.clean()

    def test_related_bill_functionality(self) -> None:
        """Test linking bills as companions in different chambers"""
        house_bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="123",
            title="Clean Energy Act",
            chamber="house",
            session="119",
            introduced_date="2023-01-01",
        )

        senate_bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="456",
            title="Clean Energy Act",
            chamber="senate",
            session="119",
            introduced_date="2023-01-15",
            related_bill=house_bill,
        )

        # Test relationship
        assert senate_bill.related_bill == house_bill
        assert house_bill.companion_bills.first() == senate_bill

        # Test that we can access related bill
        house_bill.refresh_from_db()
        assert house_bill.companion_bills.count() == 1

    def test_bill_with_sponsors_and_cosponsors(self) -> None:
        """Test bill relationships with legislators"""
        # Create federal legislators
        sponsor = Legislator.objects.create(
            level="federal",
            bioguide_id="S000001",
            first_name="John",
            last_name="Sponsor",
            chamber="house",
            state="CA",
            party="D",
        )

        cosponsor = Legislator.objects.create(
            level="federal",
            bioguide_id="C000001",
            first_name="Jane",
            last_name="Cosponsor",
            chamber="house",
            state="NY",
            party="R",
        )

        bill = Bill.objects.create(
            level="federal",
            policy=self.campaign,
            number="789",
            title="Bipartisan Bill",
            chamber="house",
            session="119",
            introduced_date="2023-03-01",
        )

        # Add relationships
        bill.sponsors.add(sponsor)
        bill.cosponsors.add(cosponsor)

        # Test relationships
        assert bill.sponsors.count() == 1
        assert bill.sponsors.first() == sponsor
        assert bill.cosponsors.count() == 1
        assert bill.cosponsors.first() == cosponsor

        # Test reverse relationships
        assert sponsor.sponsored_bills.first() == bill
        assert cosponsor.cosponsored_bills.first() == bill

    def test_bill_defaults(self) -> None:
        """Test default values for bill fields"""
        bill = Bill.objects.create(
            policy=self.campaign,
            number="999",
            title="Default Bill",
            chamber="house",
            session="119",
            introduced_date="2023-01-01",
        )

        # Test defaults
        assert bill.level == "federal"  # Default level
        assert not bill.is_primary  # Default False
        assert bill.status == ""  # Default empty
        assert bill.url == ""  # Default empty
        assert bill.related_bill is None  # Default None
