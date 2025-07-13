from django.core.exceptions import ValidationError
from django.test import TestCase

from coalition.stakeholders.validators import AddressValidator


class TestAddressValidator(TestCase):
    """Test suite for AddressValidator utility class"""

    def test_validate_state_valid(self) -> None:
        """Test validation of valid US state abbreviations"""
        # Test common states
        assert AddressValidator.validate_state("MD") == "MD"
        assert AddressValidator.validate_state("md") == "MD"  # Case insensitive
        assert AddressValidator.validate_state(" CA ") == "CA"  # Strips whitespace
        assert AddressValidator.validate_state("DC") == "DC"  # District of Columbia

    def test_validate_state_invalid(self) -> None:
        """Test validation rejects invalid state codes"""
        with self.assertRaisesRegex(ValidationError, "Invalid state code"):
            AddressValidator.validate_state("XX")

        with self.assertRaisesRegex(ValidationError, "Invalid state code"):
            AddressValidator.validate_state("Maryland")  # Full name not accepted

        with self.assertRaisesRegex(ValidationError, "State is required"):
            AddressValidator.validate_state("")

        with self.assertRaisesRegex(ValidationError, "State is required"):
            AddressValidator.validate_state(None)

    def test_validate_zip_code_valid(self) -> None:
        """Test validation of valid ZIP code formats"""
        # 5-digit ZIP
        assert AddressValidator.validate_zip_code("12345") == "12345"
        assert AddressValidator.validate_zip_code(" 12345 ") == "12345"

        # ZIP+4 format
        assert AddressValidator.validate_zip_code("12345-6789") == "12345-6789"

    def test_validate_zip_code_invalid(self) -> None:
        """Test validation rejects invalid ZIP codes"""
        invalid_zips = [
            "1234",  # Too short
            "123456",  # Too long without hyphen
            "12345-67",  # Invalid +4 extension
            "12345-",  # Incomplete
            "ABCDE",  # Letters
            "12345 6789",  # Space instead of hyphen
        ]

        for zip_code in invalid_zips:
            with self.assertRaisesRegex(ValidationError, "ZIP code must be in format"):
                AddressValidator.validate_zip_code(zip_code)

        with self.assertRaisesRegex(ValidationError, "ZIP code is required"):
            AddressValidator.validate_zip_code("")

    def test_validate_street_address_valid(self) -> None:
        """Test validation of valid street addresses"""
        valid_addresses = [
            "123 Main Street",
            "456 Oak Ave Apt 2B",
            "789 Washington Blvd Suite 100",
            "1234 Martin Luther King Jr. Boulevard",
        ]

        for address in valid_addresses:
            result = AddressValidator.validate_street_address(address)
            assert result == address.strip()

    def test_validate_street_address_invalid(self) -> None:
        """Test validation rejects invalid street addresses"""
        with self.assertRaisesRegex(ValidationError, "Street address is required"):
            AddressValidator.validate_street_address("")

        with self.assertRaisesRegex(ValidationError, "at least 5 characters"):
            AddressValidator.validate_street_address("123")

        # Test max length
        long_address = "x" * 256
        with self.assertRaisesRegex(ValidationError, "less than 255 characters"):
            AddressValidator.validate_street_address(long_address)

    def test_validate_city_valid(self) -> None:
        """Test validation of valid city names"""
        valid_cities = [
            "Baltimore",
            "Los Angeles",
            "St. Louis",
            "O'Fallon",
            "Winston-Salem",
        ]

        for city in valid_cities:
            result = AddressValidator.validate_city(city)
            assert result == city.strip().title()

    def test_validate_city_invalid(self) -> None:
        """Test validation rejects invalid city names"""
        with self.assertRaisesRegex(ValidationError, "City is required"):
            AddressValidator.validate_city("")

        with self.assertRaisesRegex(ValidationError, "at least 2 characters"):
            AddressValidator.validate_city("X")

        with self.assertRaisesRegex(ValidationError, "invalid characters"):
            AddressValidator.validate_city("City123")  # Numbers not allowed

        with self.assertRaisesRegex(ValidationError, "invalid characters"):
            AddressValidator.validate_city("City@Place")  # Special chars not allowed

    def test_validate_complete_address(self) -> None:
        """Test validation of complete addresses"""
        result = AddressValidator.validate_complete_address(
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
        )

        assert result == {
            "street_address": "123 Main St",
            "city": "Baltimore",
            "state": "MD",
            "zip_code": "21201",
        }

    def test_validate_complete_address_invalid(self) -> None:
        """Test complete address validation with invalid components"""
        with self.assertRaises(ValidationError):
            AddressValidator.validate_complete_address(
                street_address="123",  # Too short
                city="Baltimore",
                state="MD",
                zip_code="21201",
            )

    def test_format_address(self) -> None:
        """Test address formatting"""
        # Full address
        formatted = AddressValidator.format_address(
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
        )
        assert formatted == "123 Main St\nBaltimore, MD 21201"

        # Missing ZIP
        formatted = AddressValidator.format_address(
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
        )
        assert formatted == "123 Main St\nBaltimore, MD"

        # Only street address
        formatted = AddressValidator.format_address(street_address="123 Main St")
        assert formatted == "123 Main St"

        # City and state only
        formatted = AddressValidator.format_address(city="Baltimore", state="MD")
        assert formatted == "Baltimore, MD"

    def test_format_address_edge_cases(self) -> None:
        """Test address formatting edge cases for better coverage."""
        # City only
        formatted = AddressValidator.format_address(city="Baltimore")
        assert formatted == "Baltimore"

        # State with ZIP only
        formatted = AddressValidator.format_address(state="MD", zip_code="21201")
        assert formatted == "MD 21201"

        # State only
        formatted = AddressValidator.format_address(state="MD")
        assert formatted == "MD"

        # Empty inputs - should handle gracefully
        formatted = AddressValidator.format_address()
        assert formatted == ""

        # All empty strings - should handle gracefully
        formatted = AddressValidator.format_address(
            street_address="",
            city="",
            state="",
            zip_code="",
        )
        assert formatted == ""
