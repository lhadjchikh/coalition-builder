import re

from django.core.exceptions import ValidationError


class AddressValidator:
    """Utility class for validating and normalizing address components"""

    # US state abbreviations
    US_STATES = {
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
        "DC",  # District of Columbia
    }

    # ZIP code patterns
    ZIP_CODE_PATTERN = re.compile(r"^\d{5}(-\d{4})?$")

    @classmethod
    def validate_state(cls, state: str) -> str:
        """Validate and normalize US state abbreviation"""
        if not state:
            raise ValidationError("State is required")

        normalized_state = state.strip().upper()

        if normalized_state not in cls.US_STATES:
            raise ValidationError(f"Invalid state code: {state}")

        return normalized_state

    @classmethod
    def validate_zip_code(cls, zip_code: str) -> str:
        """Validate and normalize ZIP code format"""
        if not zip_code:
            raise ValidationError("ZIP code is required")

        normalized_zip = zip_code.strip()

        if not cls.ZIP_CODE_PATTERN.match(normalized_zip):
            raise ValidationError("ZIP code must be in format 12345 or 12345-6789")

        return normalized_zip

    @classmethod
    def validate_street_address(cls, street_address: str) -> str:
        """Validate and normalize street address"""
        if not street_address:
            raise ValidationError("Street address is required")

        normalized_address = street_address.strip()

        if len(normalized_address) < 5:
            raise ValidationError("Street address must be at least 5 characters")

        if len(normalized_address) > 255:
            raise ValidationError("Street address must be less than 255 characters")

        return normalized_address

    @classmethod
    def validate_city(cls, city: str) -> str:
        """Validate and normalize city name"""
        if not city:
            raise ValidationError("City is required")

        normalized_city = city.strip().title()

        if len(normalized_city) < 2:
            raise ValidationError("City name must be at least 2 characters")

        if len(normalized_city) > 100:
            raise ValidationError("City name must be less than 100 characters")

        # Basic city name validation (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", normalized_city):
            raise ValidationError("City name contains invalid characters")

        return normalized_city

    @classmethod
    def validate_complete_address(
        cls,
        street_address: str,
        city: str,
        state: str,
        zip_code: str,
    ) -> dict[str, str]:
        """Validate a complete address and return normalized components"""
        return {
            "street_address": cls.validate_street_address(street_address),
            "city": cls.validate_city(city),
            "state": cls.validate_state(state),
            "zip_code": cls.validate_zip_code(zip_code),
        }

    @classmethod
    def format_address(
        cls,
        street_address: str | None = None,
        city: str | None = None,
        state: str | None = None,
        zip_code: str | None = None,
    ) -> str:
        """Format address components into a standardized address string"""
        parts = []

        if street_address:
            parts.append(street_address.strip())

        if city and state:
            city_state = city.strip()
            if zip_code:
                city_state += f", {state.strip()} {zip_code.strip()}"
            else:
                city_state += f", {state.strip()}"
            parts.append(city_state)
        elif city:
            parts.append(city.strip())
        elif state:
            state_part = state.strip()
            if zip_code:
                state_part += f" {zip_code.strip()}"
            parts.append(state_part)

        return "\n".join(parts) if len(parts) > 1 else ", ".join(parts)
