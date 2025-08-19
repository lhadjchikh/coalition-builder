"""
Tests for API schemas validation.
"""

import pytest
from pydantic import ValidationError

from coalition.api.schemas import StakeholderCreateSchema
from coalition.test_base import BaseTestCase


class TestStakeholderCreateSchema(BaseTestCase):
    """Test StakeholderCreateSchema validation"""

    def test_state_validation_accepts_abbreviations(self) -> None:
        """Test that state validator accepts 2-letter abbreviations"""
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "street_address": "123 Main St",
            "city": "Baltimore",
            "state": "MD",  # 2-letter abbreviation
            "zip_code": "21201",
            "type": "individual",
        }

        schema = StakeholderCreateSchema(**data)
        assert schema.state == "MD"

    def test_state_validation_accepts_full_names(self) -> None:
        """Test that state validator accepts full state names"""
        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@example.com",
            "street_address": "456 Oak Ave",
            "city": "Baltimore",
            "state": "Maryland",  # Full state name
            "zip_code": "21201",
            "type": "business",
        }

        schema = StakeholderCreateSchema(**data)
        assert schema.state == "Maryland"

    def test_state_validation_strips_whitespace(self) -> None:
        """Test that state validator strips whitespace"""
        data = {
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob@example.com",
            "street_address": "789 Pine St",
            "city": "Los Angeles",
            "state": "  California  ",  # With whitespace
            "zip_code": "90001",
            "type": "nonprofit",
        }

        schema = StakeholderCreateSchema(**data)
        assert schema.state == "California"

    def test_state_validation_case_insensitive(self) -> None:
        """Test that state validation handles various cases"""
        test_cases = [
            "california",
            "CALIFORNIA",
            "California",
            "ca",
            "CA",
            "Ca",
        ]

        for state_input in test_cases:
            data = {
                "first_name": "Test",
                "last_name": "User",
                "email": f"test_{state_input}@example.com",
                "street_address": "123 Test St",
                "city": "Test City",
                "state": state_input,
                "zip_code": "12345",
                "type": "individual",
            }

            schema = StakeholderCreateSchema(**data)
            # Should accept without raising an error
            assert schema.state == state_input.strip()

    def test_state_validation_rejects_empty(self) -> None:
        """Test that state validator rejects empty strings"""
        data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "street_address": "123 Test St",
            "city": "Test City",
            "state": "",  # Empty string
            "zip_code": "12345",
            "type": "individual",
        }

        try:
            StakeholderCreateSchema(**data)
            pytest.fail("Should have raised ValidationError")
        except ValidationError as e:
            errors = e.errors()
            assert any(
                error["loc"] == ("state",) and "State is required" in str(error["msg"])
                for error in errors
            )

    def test_zip_code_validation(self) -> None:
        """Test ZIP code validation"""
        # Valid ZIP codes
        valid_zips = ["12345", "12345-6789"]

        for zip_code in valid_zips:
            data = {
                "first_name": "Test",
                "last_name": "User",
                "email": f"test_{zip_code}@example.com",
                "street_address": "123 Test St",
                "city": "Test City",
                "state": "MD",
                "zip_code": zip_code,
                "type": "individual",
            }

            schema = StakeholderCreateSchema(**data)
            assert schema.zip_code == zip_code

        # Invalid ZIP codes
        invalid_zips = ["1234", "123456", "abcde", "12345-", "12345-67"]

        for zip_code in invalid_zips:
            data = {
                "first_name": "Test",
                "last_name": "User",
                "email": f"test_{zip_code}@example.com",
                "street_address": "123 Test St",
                "city": "Test City",
                "state": "MD",
                "zip_code": zip_code,
                "type": "individual",
            }

            try:
                StakeholderCreateSchema(**data)
                pytest.fail(f"Should have raised ValidationError for {zip_code}")
            except (ValidationError, Exception):
                pass  # Expected - can be either Pydantic or Django ValidationError

    def test_optional_fields(self) -> None:
        """Test that optional fields work correctly"""
        data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "street_address": "123 Test St",
            "city": "Test City",
            "state": "MD",
            "zip_code": "12345",
            "type": "individual",
            # Optional fields not provided
        }

        schema = StakeholderCreateSchema(**data)
        assert schema.organization == ""
        assert schema.role == ""
        assert schema.county == ""
        assert schema.email_updates is False
