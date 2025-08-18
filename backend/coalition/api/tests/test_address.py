from typing import Any
from unittest.mock import MagicMock, patch

from django.test import TestCase
from ninja.testing import TestClient

from coalition.api.address import router


class TestAddressAPI(TestCase):
    """Test suite for Address API endpoints"""

    def setUp(self) -> None:
        """Set up test client"""
        self.client = TestClient(router)

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_success(self, mock_geocoding_class: Any) -> None:
        """Test successful address suggestions retrieval"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = [
            {"text": "100 Congress Ave, Austin, TX 78701", "place_id": "place123"},
            {"text": "100 Congress St, Austin, TX 78701", "place_id": "place456"},
        ]

        response = self.client.get("/suggestions?q=100 Congress")

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert len(data["suggestions"]) == 2
        assert data["suggestions"][0]["place_id"] == "place123"
        mock_service.get_address_suggestions.assert_called_once_with("100 Congress", 5)

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_with_limit(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test address suggestions with custom limit"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = [
            {"text": "Address 1", "place_id": "p1"},
            {"text": "Address 2", "place_id": "p2"},
            {"text": "Address 3", "place_id": "p3"},
        ]

        response = self.client.get("/suggestions?q=test address&limit=3")

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        mock_service.get_address_suggestions.assert_called_once_with("test address", 3)

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_limit_capped(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test that limit is capped at 10"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = []

        response = self.client.get("/suggestions?q=test address&limit=20")

        assert response.status_code == 200
        # Verify limit was capped at 10
        mock_service.get_address_suggestions.assert_called_once_with("test address", 10)

    def test_get_address_suggestions_short_query(self) -> None:
        """Test validation for short query string"""
        response = self.client.get("/suggestions?q=ab")

        assert response.status_code == 400
        assert "Query must be at least 3 characters" in response.json()["detail"]

    def test_get_address_suggestions_empty_query(self) -> None:
        """Test validation for empty query string"""
        response = self.client.get("/suggestions?q=")

        assert response.status_code == 400
        assert "Query must be at least 3 characters" in response.json()["detail"]

    def test_get_address_suggestions_whitespace_query(self) -> None:
        """Test validation for whitespace-only query"""
        response = self.client.get("/suggestions?q=   ")

        assert response.status_code == 400
        assert "Query must be at least 3 characters" in response.json()["detail"]

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_strips_whitespace(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test that query whitespace is stripped"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = []

        response = self.client.get("/suggestions?q=  test query  ")

        assert response.status_code == 200
        # Verify query was stripped
        mock_service.get_address_suggestions.assert_called_once_with("test query", 5)

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_service_exception(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test handling of service exceptions"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.side_effect = Exception("Service error")

        response = self.client.get("/suggestions?q=test query")

        assert response.status_code == 500
        assert "Failed to get address suggestions" in response.json()["detail"]

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_empty_results(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test handling of empty results"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = []

        response = self.client.get("/suggestions?q=nonexistent address")

        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["suggestions"] == []

    @patch("coalition.api.address.GeocodingService")
    def test_get_place_details_success(self, mock_geocoding_class: Any) -> None:
        """Test successful place details retrieval"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_place_details.return_value = {
            "street_address": "100 Congress Ave",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "country": "USA",
        }

        response = self.client.get("/place/place123")

        assert response.status_code == 200
        data = response.json()
        assert data["street_address"] == "100 Congress Ave"
        assert data["city"] == "Austin"
        assert data["state"] == "TX"
        assert data["zip_code"] == "78701"
        assert data["country"] == "USA"
        mock_service.get_place_details.assert_called_once_with("place123")

    @patch("coalition.api.address.GeocodingService")
    def test_get_place_details_not_found(self, mock_geocoding_class: Any) -> None:
        """Test place not found scenario"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_place_details.return_value = None

        response = self.client.get("/place/nonexistent")

        assert response.status_code == 404
        assert "Place not found" in response.json()["detail"]

    def test_get_place_details_empty_place_id(self) -> None:
        """Test validation for empty place_id"""
        # The route /place/ without a place_id doesn't exist, so we can't resolve it
        # This is expected behavior - the route requires a place_id parameter
        # We can test with an empty-like place_id instead
        with self.assertRaises(Exception) as context:
            self.client.get("/place/")
        assert 'Cannot resolve "/place/"' in str(context.exception)

    @patch("coalition.api.address.GeocodingService")
    def test_get_place_details_service_exception(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test handling of service exceptions"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_place_details.side_effect = Exception("Service error")

        response = self.client.get("/place/place123")

        assert response.status_code == 500
        assert "Failed to get place details" in response.json()["detail"]

    @patch("coalition.api.address.GeocodingService")
    def test_get_place_details_with_special_characters(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test place_id with special characters"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_place_details.return_value = {
            "street_address": "123 Main St",
            "city": "Test City",
            "state": "TC",
            "zip_code": "12345",
            "country": "USA",
        }

        place_id = "place_with-special.chars123"
        response = self.client.get(f"/place/{place_id}")

        assert response.status_code == 200
        mock_service.get_place_details.assert_called_once_with(place_id)

    @patch("coalition.api.address.logger")
    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_logs_error(
        self,
        mock_geocoding_class: Any,
        mock_logger: Any,
    ) -> None:
        """Test that errors are logged for suggestions endpoint"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        error = Exception("Test error")
        mock_service.get_address_suggestions.side_effect = error

        response = self.client.get("/suggestions?q=test")

        assert response.status_code == 500
        mock_logger.error.assert_called_once()
        error_msg = mock_logger.error.call_args[0][0]
        assert "Error getting address suggestions" in error_msg

    @patch("coalition.api.address.logger")
    @patch("coalition.api.address.GeocodingService")
    def test_get_place_details_logs_error(
        self,
        mock_geocoding_class: Any,
        mock_logger: Any,
    ) -> None:
        """Test that errors are logged for place details endpoint"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        error = Exception("Test error")
        mock_service.get_place_details.side_effect = error

        response = self.client.get("/place/place123")

        assert response.status_code == 500
        mock_logger.error.assert_called_once()
        error_msg = mock_logger.error.call_args[0][0]
        assert "Error getting place details" in error_msg

    @patch("coalition.api.address.GeocodingService")
    def test_get_address_suggestions_multiple_calls(
        self,
        mock_geocoding_class: Any,
    ) -> None:
        """Test multiple calls to suggestions endpoint"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = [
            {"text": "Result 1", "place_id": "p1"},
        ]

        # Make multiple requests
        response1 = self.client.get("/suggestions?q=query1")
        response2 = self.client.get("/suggestions?q=query2&limit=7")

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Verify both calls were made correctly
        assert mock_service.get_address_suggestions.call_count == 2
        calls = mock_service.get_address_suggestions.call_args_list
        assert calls[0][0] == ("query1", 5)
        assert calls[1][0] == ("query2", 7)

    @patch("coalition.api.address.GeocodingService")
    def test_suggestions_with_unicode_query(self, mock_geocoding_class: Any) -> None:
        """Test suggestions with unicode characters in query"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        mock_service.get_address_suggestions.return_value = []

        response = self.client.get("/suggestions?q=café street")

        assert response.status_code == 200
        mock_service.get_address_suggestions.assert_called_once_with("café street", 5)

    @patch("coalition.api.address.GeocodingService")
    def test_place_details_partial_response(self, mock_geocoding_class: Any) -> None:
        """Test place details with partial address components"""
        mock_service = MagicMock()
        mock_geocoding_class.return_value = mock_service

        # Return partial data (missing some fields)
        mock_service.get_place_details.return_value = {
            "street_address": "123 Main St",
            "city": "Test City",
            "state": "",  # Empty state
            "zip_code": "",  # Empty zip
            "country": "USA",
        }

        response = self.client.get("/place/place123")

        assert response.status_code == 200
        data = response.json()
        assert data["street_address"] == "123 Main St"
        assert data["city"] == "Test City"
        assert data["state"] == ""
        assert data["zip_code"] == ""
