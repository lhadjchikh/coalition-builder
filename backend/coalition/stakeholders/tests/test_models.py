from django.contrib.gis.geos import Point
from django.test import TestCase

from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder


class TestStakeholderModel(TestCase):
    """Test suite for Stakeholder model with new address and location fields"""

    def test_stakeholder_creation_with_address(self) -> None:
        """Test creating a stakeholder with full address information"""
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="Doe",
            organization="Test Org",
            email="john@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            county="Baltimore",
            location=Point(-76.6122, 39.2904),
            type="individual",
        )

        assert stakeholder.street_address == "123 Main St"
        assert stakeholder.city == "Baltimore"
        assert stakeholder.state == "MD"
        assert stakeholder.zip_code == "21201"
        assert stakeholder.full_address == "123 Main St, Baltimore, MD 21201"

    def test_stakeholder_normalization(self) -> None:
        """Test that email and state are normalized on save"""
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="Doe",
            organization="Test Org",
            email="JANE@EXAMPLE.COM",
            street_address="456 Oak Ave",
            city="Austin",
            state="tx",
            zip_code="78701",
            location=Point(-97.7431, 30.2672),
            type="individual",
        )

        assert stakeholder.email == "jane@example.com"  # Lowercase
        assert stakeholder.state == "TX"  # Uppercase

    def test_location_properties(self) -> None:
        """Test latitude and longitude properties"""
        # All stakeholders have location now
        point = Point(-76.6122, 39.2904)  # Baltimore coordinates
        stakeholder = Stakeholder(
            first_name="Location",
            last_name="Test",
            organization="Test Org",
            email="location@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            location=point,
            type="individual",
        )
        assert stakeholder.latitude == 39.2904
        assert stakeholder.longitude == -76.6122

    def test_district_relationships(self) -> None:
        """Test relationships with Region districts"""
        # Create test regions
        congressional = Region.objects.create(
            geoid="2403",
            name="Maryland District 3",
            abbrev="MD-03",
            type="congressional_district",
        )

        state_senate = Region.objects.create(
            geoid="24021",
            name="Maryland Senate District 21",
            abbrev="MD-SD-21",
            type="state_senate_district",
        )

        state_house = Region.objects.create(
            geoid="2421A",
            name="Maryland House District 21A",
            abbrev="MD-HD-21A",
            type="state_house_district",
        )

        # Create stakeholder with districts
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="Test",
            organization="Test Org",
            email="district@example.com",
            street_address="789 Pine St",
            city="Baltimore",
            state="MD",
            zip_code="21202",
            location=Point(-76.6122, 39.2904),
            type="individual",
            congressional_district=congressional,
            state_senate_district=state_senate,
            state_house_district=state_house,
        )

        assert stakeholder.congressional_district.abbrev == "MD-03"
        assert stakeholder.state_senate_district.abbrev == "MD-SD-21"
        assert stakeholder.state_house_district.abbrev == "MD-HD-21A"

    def test_full_address_formatting(self) -> None:
        """Test various full_address property scenarios"""
        # Full address (all fields required now)
        s1 = Stakeholder(
            first_name="Test",
            last_name="User",
            organization="Test Org",
            email="test@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            location=Point(-76.6122, 39.2904),
            type="individual",
        )
        assert s1.full_address == "123 Main St, Baltimore, MD 21201"

    def test_name_property_variations(self) -> None:
        """Test name property with different combinations of first/last name"""
        # Both first and last name
        s1 = Stakeholder(
            first_name="John",
            last_name="Doe",
            email="test@example.com",
            type="individual",
        )
        assert s1.name == "John Doe"

        # Only first name
        s2 = Stakeholder(
            first_name="John",
            last_name="",
            email="test@example.com",
            type="individual",
        )
        assert s2.name == "John"

        # Only last name
        s3 = Stakeholder(
            first_name="",
            last_name="Doe",
            email="test@example.com",
            type="individual",
        )
        assert s3.name == "Doe"

        # Neither first nor last name
        s4 = Stakeholder(
            first_name="",
            last_name="",
            email="test@example.com",
            type="individual",
        )
        assert s4.name == ""

    def test_str_method(self) -> None:
        """Test string representation of stakeholder"""
        # With organization
        s1 = Stakeholder(
            first_name="John",
            last_name="Doe",
            organization="Acme Corp",
            email="test@example.com",
            type="business",
        )
        assert str(s1) == "Acme Corp – John Doe"

        # Without organization
        s2 = Stakeholder(
            first_name="Jane",
            last_name="Smith",
            organization="",
            email="test@example.com",
            type="individual",
        )
        assert str(s2) == "Jane Smith"

    def test_location_properties_none(self) -> None:
        """Test latitude/longitude properties when location is None"""
        stakeholder = Stakeholder(
            first_name="No",
            last_name="Location",
            email="test@example.com",
            type="individual",
            location=None,
        )
        assert stakeholder.latitude is None
        assert stakeholder.longitude is None

    def test_save_zip_code_normalization(self) -> None:
        """Test that zip code is stripped of whitespace on save"""
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="  21201  ",  # Extra whitespace
            type="individual",
        )
        assert stakeholder.zip_code == "21201"

    def test_save_without_optional_fields(self) -> None:
        """Test save method when optional fields are None"""
        stakeholder = Stakeholder.objects.create(
            first_name="Test",
            last_name="User",
            email="optional@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            type="individual",
            # Optional fields not provided
        )
        # Should not raise any errors
        assert stakeholder.id is not None
        assert stakeholder.email == "optional@example.com"
        # Check optional fields are None/empty
        assert stakeholder.organization == ""  # blank=True means empty string, not None
        assert stakeholder.role == ""
        assert stakeholder.county == ""
        assert stakeholder.location is None
        assert stakeholder.congressional_district is None
        assert stakeholder.state_senate_district is None
        assert stakeholder.state_house_district is None
