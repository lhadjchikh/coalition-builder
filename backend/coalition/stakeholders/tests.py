from django.core.exceptions import ValidationError
from django.test import TestCase

from .models import Stakeholder


class StakeholderModelTest(TestCase):
    def setUp(self) -> None:
        self.stakeholder_data = {
            "name": "John Doe",
            "organization": "Test Farm LLC",
            "role": "Owner",
            "email": "john@testfarm.com",
            "state": "MD",
            "county": "Anne Arundel",
            "type": "farmer",
        }

    def test_create_stakeholder(self) -> None:
        """Test creating a stakeholder with valid data"""
        stakeholder = Stakeholder.objects.create(**self.stakeholder_data)
        assert stakeholder.name == "John Doe"
        assert stakeholder.organization == "Test Farm LLC"
        assert stakeholder.type == "farmer"
        assert stakeholder.state == "MD"
        assert stakeholder.created_at is not None

    def test_stakeholder_str_representation(self) -> None:
        """Test string representation of stakeholder"""
        stakeholder = Stakeholder.objects.create(**self.stakeholder_data)
        expected_str = "Test Farm LLC – John Doe"
        assert str(stakeholder) == expected_str

    def test_stakeholder_type_choices(self) -> None:
        """Test that only valid stakeholder types are accepted"""
        valid_types = [
            "farmer",
            "waterman",
            "business",
            "nonprofit",
            "individual",
            "government",
            "other",
        ]

        for stakeholder_type in valid_types:
            data = self.stakeholder_data.copy()
            data["type"] = stakeholder_type
            data["email"] = f"test{stakeholder_type}@example.com"  # Make emails unique
            data["organization"] = f"Test {stakeholder_type} Org"  # Make orgs unique
            stakeholder = Stakeholder.objects.create(**data)
            assert stakeholder.type == stakeholder_type

    def test_optional_fields(self) -> None:
        """Test that optional fields can be blank"""
        minimal_data = {
            "name": "Jane Smith",
            "organization": "Smith Industries",
            "email": "jane@smith.com",
            "state": "VA",
            "type": "business",
        }
        stakeholder = Stakeholder.objects.create(**minimal_data)
        assert stakeholder.role == ""
        assert stakeholder.county == ""

    def test_email_validation(self) -> None:
        """Test email field validation"""
        invalid_data = self.stakeholder_data.copy()
        invalid_data["email"] = "invalid-email"

        stakeholder = Stakeholder(**invalid_data)
        with self.assertRaises(ValidationError):
            stakeholder.full_clean()

    def test_email_normalization(self) -> None:
        """Test that email is normalized to lowercase on save"""
        data = self.stakeholder_data.copy()
        data["email"] = "JOHN@TESTFARM.COM"  # Uppercase email

        stakeholder = Stakeholder.objects.create(**data)

        # Email should be normalized to lowercase
        assert stakeholder.email == "john@testfarm.com"

    def test_email_case_insensitive_uniqueness(self) -> None:
        """Test that email uniqueness is case-insensitive via normalization"""
        # Create stakeholder with lowercase email
        Stakeholder.objects.create(**self.stakeholder_data)

        # Try to create another with uppercase email - should fail due to normalization
        data2 = self.stakeholder_data.copy()
        data2["email"] = data2["email"].upper()
        data2["organization"] = "Different Organization"

        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Stakeholder.objects.create(**data2)

    def test_updated_at_field(self) -> None:
        """Test that updated_at field is automatically maintained"""
        stakeholder = Stakeholder.objects.create(**self.stakeholder_data)
        original_updated_at = stakeholder.updated_at

        # Update the stakeholder
        stakeholder.role = "Senior Owner"
        stakeholder.save()

        # updated_at should have changed
        stakeholder.refresh_from_db()
        assert stakeholder.updated_at > original_updated_at

    def test_email_unique_constraint(self) -> None:
        """Test that email unique constraint prevents duplicates"""
        from django.db import IntegrityError

        # Create first stakeholder
        Stakeholder.objects.create(**self.stakeholder_data)

        # Try to create second stakeholder with same email
        data2 = self.stakeholder_data.copy()
        data2["organization"] = "Different Organization"

        with self.assertRaises(IntegrityError):
            Stakeholder.objects.create(**data2)
