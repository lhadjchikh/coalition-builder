from typing import Any
from unittest.mock import MagicMock, Mock, patch

from django.contrib.gis.geos import Point
from django.test import TestCase

from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder
from coalition.stakeholders.services import GeocodingService


class TestGeocodingService(TestCase):
    """Test suite for GeocodingService"""

    def setUp(self) -> None:
        """Set up test data"""
        self.geocoding_service = GeocodingService()

        # Create a sample stakeholder with complete address
        self.sample_stakeholder = Stakeholder.objects.create(
            name="Test User",
            organization="Test Org",
            email="test@example.com",
            street_address="100 Congress Ave",
            city="Austin",
            state="TX",
            zip_code="78701",
            location=Point(-97.7431, 30.2672),
            type="individual",
        )

        # Create sample regions for testing district assignment
        from django.contrib.gis.geos import MultiPolygon, Polygon

        # Create a simple polygon around Austin, TX
        coords = [
            (-97.75, 30.25),  # SW corner
            (-97.75, 30.30),  # NW corner
            (-97.70, 30.30),  # NE corner
            (-97.70, 30.25),  # SE corner
            (-97.75, 30.25),  # Close polygon
        ]
        polygon = Polygon(coords)
        multi_polygon = MultiPolygon(polygon)

        self.congressional = Region.objects.create(
            geoid="4821",
            name="Texas District 21",
            abbrev="TX-21",
            type="congressional_district",
            geom=multi_polygon,
        )

        self.state_senate = Region.objects.create(
            geoid="48014",
            name="Texas Senate District 14",
            abbrev="TX-SD-14",
            type="state_senate_district",
            geom=multi_polygon,
        )

        self.state_house = Region.objects.create(
            geoid="48046",
            name="Texas House District 46",
            abbrev="TX-HD-46",
            type="state_house_district",
            geom=multi_polygon,
        )

        self.sample_regions = {
            "congressional": self.congressional,
            "state_senate": self.state_senate,
            "state_house": self.state_house,
        }

    def test_geocode_address_validation_failure(self) -> None:
        """Test geocoding with invalid address"""
        result = self.geocoding_service.geocode_address(
            street_address="",
            city="Austin",
            state="TX",
            zip_code="78701",  # Invalid
        )
        assert result is None

    @patch("coalition.stakeholders.services.connection")
    def test_geocode_with_tiger_success(self, mock_connection: Any) -> None:
        """Test successful geocoding with TIGER geocoder"""
        # Mock cursor and result
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (-97.7431, 30.2672, 10)  # lon, lat, rating
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        result = self.geocoding_service._geocode_with_tiger(
            {
                "street_address": "100 Congress Ave",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
            },
        )

        assert isinstance(result, Point)
        assert result.x == -97.7431  # longitude
        assert result.y == 30.2672  # latitude
        assert result.srid == 4326

    @patch("coalition.stakeholders.services.connection")
    def test_geocode_with_tiger_low_confidence(self, mock_connection: Any) -> None:
        """Test TIGER geocoder rejects low confidence results"""
        # Mock cursor with poor rating
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (-97.7431, 30.2672, 25)  # rating > 20
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        result = self.geocoding_service._geocode_with_tiger(
            {
                "street_address": "100 Congress Ave",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
            },
        )

        assert result is None

    def test_geocode_with_nominatim_success(self) -> None:
        """Test successful geocoding with Nominatim"""
        # Mock Nominatim response
        mock_location = Mock()
        mock_location.longitude = -97.7431
        mock_location.latitude = 30.2672

        with patch.object(
            self.geocoding_service.nominatim,
            "geocode",
            return_value=mock_location,
        ):
            result = self.geocoding_service._geocode_with_nominatim(
                {
                    "street_address": "100 Congress Ave",
                    "city": "Austin",
                    "state": "TX",
                    "zip_code": "78701",
                },
            )

            assert isinstance(result, Point)
            assert result.x == -97.7431
            assert result.y == 30.2672

    def test_assign_legislative_districts(self) -> None:
        """Test district assignment for a point"""
        # Point in Austin, TX (within our test regions)
        point = Point(-97.7431, 30.2672)

        districts = self.geocoding_service.assign_legislative_districts(point)

        assert districts["congressional_district"].abbrev == "TX-21"
        assert districts["state_legislative_upper"].abbrev == "TX-SD-14"
        assert districts["state_legislative_lower"].abbrev == "TX-HD-46"

    def test_assign_legislative_districts_no_match(self) -> None:
        """Test district assignment when point doesn't match any districts"""
        # Point outside our test regions
        point = Point(-100.0, 35.0)

        districts = self.geocoding_service.assign_legislative_districts(point)

        assert districts["congressional_district"] is None
        assert districts["state_legislative_upper"] is None
        assert districts["state_legislative_lower"] is None

    @patch("coalition.stakeholders.services.connection")
    def test_geocode_and_assign_districts_success(self, mock_connection: Any) -> None:
        """Test full geocoding and district assignment process"""
        # Mock successful TIGER geocoding
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (-97.7431, 30.2672, 10)
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        success = self.geocoding_service.geocode_and_assign_districts(
            self.sample_stakeholder,
        )

        # Refresh from database
        self.sample_stakeholder.refresh_from_db()

        assert success
        assert self.sample_stakeholder.location is not None
        assert self.sample_stakeholder.geocoded_at is not None
        assert self.sample_stakeholder.congressional_district.abbrev == "TX-21"
        assert self.sample_stakeholder.state_senate_district.abbrev == "TX-SD-14"
        assert self.sample_stakeholder.state_house_district.abbrev == "TX-HD-46"

    @patch("coalition.stakeholders.services.connection")
    def test_geocode_address_fallback_to_nominatim(self, mock_connection: Any) -> None:
        """Test fallback to Nominatim when TIGER fails"""
        # Mock TIGER failure
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = None
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        # Mock Nominatim success
        mock_location = Mock()
        mock_location.longitude = -97.7431
        mock_location.latitude = 30.2672

        with patch.object(
            self.geocoding_service.nominatim,
            "geocode",
            return_value=mock_location,
        ):
            result = self.geocoding_service.geocode_address(
                street_address="100 Congress Ave",
                city="Austin",
                state="TX",
                zip_code="78701",
            )

            assert isinstance(result, Point)
            assert result.x == -97.7431
