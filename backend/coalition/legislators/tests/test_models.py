from django.core.exceptions import ValidationError
from django.test import TestCase

from coalition.regions.models import Region

from ..models import Legislator


class LegislatorModelTest(TestCase):
    """Test the Legislator model for both federal and state legislators"""

    def setUp(self) -> None:
        # Create a test state region
        self.california = Region.objects.create(
            name="California",
            type="state",
            geoid="06",
        )

    def test_create_federal_legislator(self) -> None:
        """Test creating a federal legislator"""
        legislator = Legislator.objects.create(
            level="federal",
            bioguide_id="F000001",
            first_name="John",
            last_name="Federal",
            chamber="house",
            state="CA",
            district="12",
            party="D",
        )

        assert legislator.level == "federal"
        assert legislator.bioguide_id == "F000001"
        assert legislator.first_name == "John"
        assert legislator.last_name == "Federal"
        assert legislator.chamber == "house"
        assert legislator.state == "CA"
        assert legislator.district == "12"
        assert legislator.party == "D"
        assert legislator.in_office  # Default True
        assert legislator.state_region is None
        assert legislator.state_id == ""

    def test_create_state_legislator(self) -> None:
        """Test creating a state legislator"""
        legislator = Legislator.objects.create(
            level="state",
            state_id="CA-STATE-001",
            first_name="Jane",
            last_name="State",
            chamber="assembly",
            state="CA",
            state_region=self.california,
            district="15",
            party="Democrat",
        )

        assert legislator.level == "state"
        assert legislator.bioguide_id is None
        assert legislator.state_id == "CA-STATE-001"
        assert legislator.first_name == "Jane"
        assert legislator.last_name == "State"
        assert legislator.chamber == "assembly"
        assert legislator.state == "CA"
        assert legislator.state_region == self.california
        assert legislator.district == "15"
        assert legislator.party == "Democrat"

    def test_legislator_str_representations(self) -> None:
        """Test string representations for federal and state legislators"""
        # Federal legislator
        federal_legislator = Legislator.objects.create(
            level="federal",
            bioguide_id="F000001",
            first_name="John",
            last_name="Smith",
            chamber="senate",
            state="TX",
            party="R",
        )
        assert str(federal_legislator) == "John Smith (R-TX)"

        # State legislator
        state_legislator = Legislator.objects.create(
            level="state",
            state_id="NY-001",
            first_name="Maria",
            last_name="Garcia",
            chamber="assembly",
            state="NY",
            state_region=self.california,  # Using CA region for test
            party="D",
        )
        assert str(state_legislator) == "State Maria Garcia (D-NY)"

    def test_legislator_display_names(self) -> None:
        """Test display name method for different legislator types"""
        # Federal House legislator with district
        house_rep = Legislator.objects.create(
            level="federal",
            bioguide_id="H000001",
            first_name="Alex",
            last_name="House",
            chamber="house",
            state="FL",
            district="7",
            party="D",
        )
        assert house_rep.display_name() == "Alex House – District 7 – FL"

        # Federal Senate legislator (senior)
        senior_senator = Legislator.objects.create(
            level="federal",
            bioguide_id="S000001",
            first_name="Bob",
            last_name="Senior",
            chamber="senate",
            state="CA",
            is_senior=True,
            party="R",
        )
        assert senior_senator.display_name() == "Bob Senior (Sr.) – CA"

        # Federal Senate legislator (junior)
        junior_senator = Legislator.objects.create(
            level="federal",
            bioguide_id="J000001",
            first_name="Carol",
            last_name="Junior",
            chamber="senate",
            state="NY",
            is_senior=False,
            party="D",
        )
        assert junior_senator.display_name() == "Carol Junior (Jr.) – NY"

        # State legislator with district
        state_rep = Legislator.objects.create(
            level="state",
            state_id="TX-001",
            first_name="David",
            last_name="State",
            chamber="state_house",
            state="TX",
            district="25",
            party="R",
        )
        assert state_rep.display_name() == "State David State – District 25 – TX"

    def test_federal_legislator_validation(self) -> None:
        """Test that federal legislators must have bioguide_id"""
        legislator = Legislator(
            level="federal",
            # Missing bioguide_id
            first_name="Invalid",
            last_name="Federal",
            chamber="house",
            state="CA",
            party="D",
        )

        with self.assertRaises(ValidationError):
            legislator.clean()

    def test_state_legislator_validation(self) -> None:
        """Test that state legislators should not have bioguide_id"""
        legislator = Legislator(
            level="state",
            bioguide_id="S000001",  # State legislators shouldn't have this
            first_name="Invalid",
            last_name="State",
            chamber="assembly",
            state="CA",
            party="D",
        )

        with self.assertRaises(ValidationError):
            legislator.clean()

    def test_legislator_defaults(self) -> None:
        """Test default values for legislator fields"""
        legislator = Legislator.objects.create(
            bioguide_id="D000001",
            first_name="Default",
            last_name="Legislator",
            chamber="house",
            state="VA",
            party="I",
        )

        # Test defaults
        assert legislator.level == "federal"  # Default level
        assert legislator.in_office  # Default True
        assert legislator.is_senior is None  # Default None
        assert legislator.district == ""  # Default empty
        assert legislator.url == ""  # Default empty
        assert legislator.state_id == ""  # Default empty
        assert legislator.state_region is None  # Default None

    def test_legislator_with_bills(self) -> None:
        """Test legislator relationships with bills"""
        from coalition.campaigns.models import Bill, PolicyCampaign

        # Create test data
        campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
        )

        sponsor = Legislator.objects.create(
            level="federal",
            bioguide_id="S000001",
            first_name="Sponsor",
            last_name="Smith",
            chamber="house",
            state="CA",
            party="D",
        )

        cosponsor = Legislator.objects.create(
            level="federal",
            bioguide_id="C000001",
            first_name="Cosponsor",
            last_name="Jones",
            chamber="senate",
            state="NY",
            party="R",
        )

        # Create bill with relationships
        bill = Bill.objects.create(
            level="federal",
            policy=campaign,
            number="123",
            title="Test Bill",
            chamber="house",
            session="119",
            introduced_date="2023-01-01",
        )

        bill.sponsors.add(sponsor)
        bill.cosponsors.add(cosponsor)

        # Test reverse relationships
        assert sponsor.sponsored_bills.count() == 1
        assert sponsor.sponsored_bills.first() == bill
        assert cosponsor.cosponsored_bills.count() == 1
        assert cosponsor.cosponsored_bills.first() == bill

    def test_different_chamber_types(self) -> None:
        """Test legislators in different types of chambers"""
        chambers_to_test = [
            ("house", "U.S. House"),
            ("senate", "U.S. Senate"),
            ("state_house", "State House"),
            ("state_senate", "State Senate"),
            ("assembly", "State Assembly"),
            ("house_of_delegates", "House of Delegates"),
        ]

        for chamber_code, chamber_name in chambers_to_test:
            if chamber_code in ["house", "senate"]:
                # Federal chambers
                legislator = Legislator.objects.create(
                    level="federal",
                    bioguide_id=f"T{chamber_code[0].upper()}001",
                    first_name="Test",
                    last_name=f"{chamber_name.replace(' ', '')}",
                    chamber=chamber_code,
                    state="CA",
                    party="D",
                )
            else:
                # State chambers
                legislator = Legislator.objects.create(
                    level="state",
                    state_id=f"CA-{chamber_code.upper()}-001",
                    first_name="Test",
                    last_name=f"{chamber_name.replace(' ', '')}",
                    chamber=chamber_code,
                    state="CA",
                    state_region=self.california,
                    party="D",
                )

            assert legislator.chamber == chamber_code
            # Verify the legislator was created successfully
            assert legislator.pk is not None

    def test_unique_bioguide_id(self) -> None:
        """Test that bioguide_id is unique when not null"""
        # Create first legislator
        Legislator.objects.create(
            level="federal",
            bioguide_id="U000001",
            first_name="First",
            last_name="Unique",
            chamber="house",
            state="CA",
            party="D",
        )

        # Try to create second legislator with same bioguide_id
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Legislator.objects.create(
                level="federal",
                bioguide_id="U000001",  # Duplicate
                first_name="Second",
                last_name="Duplicate",
                chamber="senate",
                state="NY",
                party="R",
            )

    def test_multiple_null_bioguide_ids(self) -> None:
        """Test that multiple NULL bioguide_ids are allowed (for state legislators)"""
        # Create multiple state legislators with NULL bioguide_id
        state_leg1 = Legislator.objects.create(
            level="state",
            # bioguide_id is None
            state_id="CA-001",
            first_name="State1",
            last_name="Legislator",
            chamber="assembly",
            state="CA",
            state_region=self.california,
            party="D",
        )

        state_leg2 = Legislator.objects.create(
            level="state",
            # bioguide_id is None
            state_id="CA-002",
            first_name="State2",
            last_name="Legislator",
            chamber="assembly",
            state="CA",
            state_region=self.california,
            party="R",
        )

        # Both should be created successfully
        assert state_leg1.pk is not None
        assert state_leg2.pk is not None
        assert state_leg1.bioguide_id is None
        assert state_leg2.bioguide_id is None
