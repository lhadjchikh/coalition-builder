"""Base test class with fixtures for coalition tests."""

from typing import TYPE_CHECKING, Any

from django.test import TestCase, TransactionTestCase

from coalition.regions.models import Region

if TYPE_CHECKING:
    from coalition.stakeholders.models import Stakeholder


class BaseTestCase(TestCase):
    """Base test case that loads common fixtures."""

    fixtures = ["regions.json"]

    # Declare class attributes for type checking
    maryland: Region
    virginia: Region
    california: Region

    @classmethod
    def setUpTestData(cls) -> None:
        """Set up test data for the entire test class."""
        super().setUpTestData()
        cls.maryland = Region.objects.get(abbrev="MD")
        cls.virginia = Region.objects.get(abbrev="VA")
        cls.california = Region.objects.get(abbrev="CA")

    def setUp(self) -> None:
        """Set up method for compatibility with child classes."""
        super().setUp()

    def create_stakeholder(self, **kwargs: Any) -> "Stakeholder":
        """Helper to create a stakeholder with defaults."""
        from coalition.stakeholders.models import Stakeholder

        defaults = {
            "first_name": "Test",
            "last_name": "User",
            "email": f"test{Stakeholder.objects.count()}@example.com",
            "street_address": "123 Main St",
            "city": "Baltimore",
            "state": self.maryland,
            "zip_code": "21201",
            "type": "individual",
        }
        defaults.update(kwargs)
        return Stakeholder.objects.create(**defaults)


class BaseTransactionTestCase(TransactionTestCase):
    """Base transaction test case that loads common fixtures."""

    fixtures = ["regions.json"]

    # Declare instance attributes for type checking
    maryland: Region
    virginia: Region
    california: Region

    def setUp(self) -> None:
        """Set up test data for each test."""
        super().setUp()
        self.maryland = Region.objects.get(abbrev="MD")
        self.virginia = Region.objects.get(abbrev="VA")
        self.california = Region.objects.get(abbrev="CA")
