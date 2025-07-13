from django.test import TestCase

from coalition.regions.models import Region


class RegionModelTest(TestCase):
    """Test Region model."""

    def setUp(self) -> None:
        """Set up test data."""
        self.region = Region.objects.create(
            geoid="06",
            name="California",
            abbrev="CA",
            type="state",
        )

    def test_region_str(self) -> None:
        """Test string representation of Region."""
        assert str(self.region) == "California"

    def test_region_natural_key(self) -> None:
        """Test natural key method of Region."""
        natural_key = self.region.natural_key()
        assert natural_key == ("California",)
        assert isinstance(natural_key, tuple)
