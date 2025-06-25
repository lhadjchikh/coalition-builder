from django.contrib.gis.geos import Point
from django.test import TestCase

from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder


class TestStakeholderModel(TestCase):
    """Test suite for Stakeholder model with new address and location fields"""

    def test_stakeholder_creation_with_address(self) -> None:
        """Test creating a stakeholder with full address information"""
        stakeholder = Stakeholder.objects.create(
            name="John Doe",
            organization="Test Org",
            email="john@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            county="Baltimore",
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
            name="Jane Doe",
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
            name="Location Test",
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
            name="District Test",
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

    def test_geocoding_timestamp_field(self) -> None:
        """Test geocoding timestamp field"""
        stakeholder = Stakeholder.objects.create(
            name="Geocode Test",
            organization="Test Org",
            email="geocode@example.com",
            street_address="321 Test St",
            city="Baltimore",
            state="MD",
            zip_code="21203",
            location=Point(-76.6122, 39.2904),
            type="individual",
        )

        assert stakeholder.geocoded_at is not None

    def test_full_address_formatting(self) -> None:
        """Test various full_address property scenarios"""
        # Full address (all fields required now)
        s1 = Stakeholder(
            name="Test User",
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
