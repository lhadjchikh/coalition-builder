from typing import Any
from unittest.mock import MagicMock, patch

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
            first_name="Test",
            last_name="User",
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

    @patch("coalition.stakeholders.services.boto3")
    def test_geocode_with_aws_location_success(self, mock_boto3: Any) -> None:
        """Test successful geocoding with AWS Location Service"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock successful response
        mock_client.search_place_index_for_text.return_value = {
            "Results": [
                {
                    "Place": {"Geometry": {"Point": [-97.7431, 30.2672]}},
                    "Relevance": 0.95,
                },
            ],
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        result = self.geocoding_service._geocode_with_aws_location(
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

    @patch("coalition.stakeholders.services.boto3")
    def test_geocode_with_aws_location_low_confidence(self, mock_boto3: Any) -> None:
        """Test AWS Location rejects low confidence results"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock low confidence response
        mock_client.search_place_index_for_text.return_value = {
            "Results": [
                {
                    "Place": {"Geometry": {"Point": [-97.7431, 30.2672]}},
                    "Relevance": 0.5,  # Below threshold
                },
            ],
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        result = self.geocoding_service._geocode_with_aws_location(
            {
                "street_address": "100 Congress Ave",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
            },
        )

        assert result is None

    @patch("coalition.stakeholders.services.boto3")
    def test_geocode_with_aws_location_no_results(self, mock_boto3: Any) -> None:
        """Test AWS Location handling when no results found"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock empty response
        mock_client.search_place_index_for_text.return_value = {"Results": []}

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        result = self.geocoding_service._geocode_with_aws_location(
            {
                "street_address": "100 Congress Ave",
                "city": "Austin",
                "state": "TX",
                "zip_code": "78701",
            },
        )

        assert result is None

    def test_assign_legislative_districts(self) -> None:
        """Test district assignment for a point"""
        # Point in Austin, TX (within our test regions)
        point = Point(-97.7431, 30.2672)

        districts = self.geocoding_service.assign_legislative_districts(point)

        assert districts["congressional_district"].abbrev == "TX-21"
        assert districts["state_senate_district"].abbrev == "TX-SD-14"
        assert districts["state_house_district"].abbrev == "TX-HD-46"

    def test_assign_legislative_districts_no_match(self) -> None:
        """Test district assignment when point doesn't match any districts"""
        # Point outside our test regions
        point = Point(-100.0, 35.0)

        districts = self.geocoding_service.assign_legislative_districts(point)

        assert districts["congressional_district"] is None
        assert districts["state_senate_district"] is None
        assert districts["state_house_district"] is None

    @patch("coalition.stakeholders.services.boto3")
    def test_geocode_and_assign_districts_success(self, mock_boto3: Any) -> None:
        """Test full geocoding and district assignment process"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock successful response
        mock_client.search_place_index_for_text.return_value = {
            "Results": [
                {
                    "Place": {"Geometry": {"Point": [-97.7431, 30.2672]}},
                    "Relevance": 0.95,
                },
            ],
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        success = self.geocoding_service.geocode_and_assign_districts(
            self.sample_stakeholder,
        )

        # Refresh from database
        self.sample_stakeholder.refresh_from_db()

        assert success
        assert self.sample_stakeholder.location is not None
        assert self.sample_stakeholder.congressional_district.abbrev == "TX-21"
        assert self.sample_stakeholder.state_senate_district.abbrev == "TX-SD-14"
        assert self.sample_stakeholder.state_house_district.abbrev == "TX-HD-46"

    @patch("coalition.stakeholders.services.boto3")
    def test_geocode_address_with_aws_location(self, mock_boto3: Any) -> None:
        """Test geocoding address using AWS Location Service"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock successful response
        mock_client.search_place_index_for_text.return_value = {
            "Results": [
                {
                    "Place": {"Geometry": {"Point": [-97.7431, 30.2672]}},
                    "Relevance": 0.95,
                },
            ],
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        result = self.geocoding_service.geocode_address(
            street_address="100 Congress Ave",
            city="Austin",
            state="TX",
            zip_code="78701",
        )

        assert isinstance(result, Point)
        assert result.x == -97.7431
        assert result.y == 30.2672

    @patch("coalition.stakeholders.services.boto3")
    def test_get_address_suggestions(self, mock_boto3: Any) -> None:
        """Test getting address suggestions for autocomplete"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock suggestions response
        mock_client.search_place_index_for_suggestions.return_value = {
            "Results": [
                {"Text": "100 Congress Ave, Austin, TX 78701", "PlaceId": "place123"},
                {"Text": "100 Congress St, Austin, TX 78701", "PlaceId": "place456"},
            ],
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        suggestions = self.geocoding_service.get_address_suggestions(
            "100 Congress",
            max_results=2,
        )

        assert len(suggestions) == 2
        assert suggestions[0]["text"] == "100 Congress Ave, Austin, TX 78701"
        assert suggestions[0]["place_id"] == "place123"
        assert suggestions[1]["text"] == "100 Congress St, Austin, TX 78701"
        assert suggestions[1]["place_id"] == "place456"

    @patch("coalition.stakeholders.services.boto3")
    def test_get_place_details(self, mock_boto3: Any) -> None:
        """Test getting detailed address components from place ID"""
        # Mock AWS Location client
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        # Mock place details response
        mock_client.get_place.return_value = {
            "Place": {
                "AddressNumber": "100",
                "Street": "Congress Ave",
                "Municipality": "Austin",
                "Region": "TX",
                "PostalCode": "78701",
                "Country": "USA",
            },
        }

        # Set up service with mock
        self.geocoding_service.location_client = mock_client
        self.geocoding_service.place_index_name = "test-index"

        details = self.geocoding_service.get_place_details("place123")

        assert details is not None
        assert details["street_address"] == "100 Congress Ave"
        assert details["city"] == "Austin"
        assert details["state"] == "TX"
        assert details["zip_code"] == "78701"
        assert details["country"] == "USA"
