from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase

from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder
from coalition.stakeholders.spatial import SpatialQueryUtils


class TestSpatialQueryUtils(TestCase):
    """Test suite for SpatialQueryUtils methods"""

    def setUp(self) -> None:
        """Set up test data with regions and stakeholders"""
        # Create test regions with known geometry
        self.congressional_district = Region.objects.create(
            geoid="2403",
            name="Maryland District 3",
            abbrev="MD-03",
            type="congressional_district",
            geom=MultiPolygon(
                Polygon(
                    [
                        (-76.7, 39.2),
                        (-76.7, 39.3),
                        (-76.5, 39.3),
                        (-76.5, 39.2),
                        (-76.7, 39.2),
                    ],
                ),
            ),
        )

        self.state_senate_district = Region.objects.create(
            geoid="24021",
            name="Maryland Senate District 21",
            abbrev="MD-SD-21",
            type="state_senate_district",
            geom=MultiPolygon(
                Polygon(
                    [
                        (-76.7, 39.2),
                        (-76.7, 39.3),
                        (-76.5, 39.3),
                        (-76.5, 39.2),
                        (-76.7, 39.2),
                    ],
                ),
            ),
        )

        self.state_house_district = Region.objects.create(
            geoid="2421A",
            name="Maryland House District 21A",
            abbrev="MD-HD-21A",
            type="state_house_district",
            geom=MultiPolygon(
                Polygon(
                    [
                        (-76.7, 39.2),
                        (-76.7, 39.3),
                        (-76.5, 39.3),
                        (-76.5, 39.2),
                        (-76.7, 39.2),
                    ],
                ),
            ),
        )

        # Create test stakeholders
        self.stakeholder_inside = Stakeholder.objects.create(
            name="Inside Stakeholder",
            organization="Test Org",
            email="inside@example.com",
            street_address="123 Main St",
            city="Baltimore",
            state="MD",
            zip_code="21201",
            location=Point(-76.6, 39.25),  # Inside all districts
            type="individual",
            congressional_district=self.congressional_district,
            state_senate_district=self.state_senate_district,
            state_house_district=self.state_house_district,
        )

        self.stakeholder_outside = Stakeholder.objects.create(
            name="Outside Stakeholder",
            organization="Test Org",
            email="outside@example.com",
            street_address="456 Oak Ave",
            city="Austin",
            state="TX",
            zip_code="78701",
            location=Point(-97.7431, 30.2672),  # Outside districts
            type="individual",
        )

    def test_find_districts_for_point_inside(self) -> None:
        """Test finding districts for a point inside all districts"""
        point = Point(-76.6, 39.25)  # Inside all test districts
        districts = SpatialQueryUtils.find_districts_for_point(point)

        assert districts["congressional_district"] == self.congressional_district
        assert districts["state_senate_district"] == self.state_senate_district
        assert districts["state_house_district"] == self.state_house_district

    def test_find_districts_for_point_outside(self) -> None:
        """Test finding districts for a point outside all districts"""
        point = Point(-97.7431, 30.2672)  # Outside test districts
        districts = SpatialQueryUtils.find_districts_for_point(point)

        assert districts["congressional_district"] is None
        assert districts["state_senate_district"] is None
        assert districts["state_house_district"] is None

    def test_find_districts_for_point_null(self) -> None:
        """Test finding districts for a null point"""
        districts = SpatialQueryUtils.find_districts_for_point(None)

        assert districts["congressional_district"] is None
        assert districts["state_senate_district"] is None
        assert districts["state_house_district"] is None

    def test_get_stakeholders_in_district(self) -> None:
        """Test getting stakeholders within a specific district"""
        stakeholders = SpatialQueryUtils.get_stakeholders_in_district(
            self.congressional_district,
            include_unverified=True,  # Include all stakeholders for testing
        )

        # Should include stakeholder inside the district geometry
        assert len(stakeholders) >= 1
        assert self.stakeholder_inside in stakeholders
        # Should not include stakeholder outside the district
        assert self.stakeholder_outside not in stakeholders

    def test_get_stakeholders_by_district_type(self) -> None:
        """Test getting stakeholders grouped by district type"""
        result = SpatialQueryUtils.get_stakeholders_by_district_type(
            district_type="congressional_district",
        )

        # Should return dict with district names as keys
        assert isinstance(result, dict)
        assert "Maryland District 3" in result
        assert isinstance(result["Maryland District 3"], list)

        # Check that the correct stakeholder is in the district
        stakeholders_in_md3 = result["Maryland District 3"]
        assert self.stakeholder_inside in stakeholders_in_md3

    def test_get_stakeholders_by_district_type_with_state_filter(self) -> None:
        """Test getting stakeholders by district type with state filter"""
        result = SpatialQueryUtils.get_stakeholders_by_district_type(
            district_type="congressional_district",
            state_filter="MD",
        )

        # Should only include Maryland districts
        assert isinstance(result, dict)
        # Should include our Maryland district
        assert "Maryland District 3" in result

    def test_find_nearby_stakeholders(self) -> None:
        """Test finding stakeholders near a point"""
        center_point = Point(-76.6, 39.25)  # Near inside stakeholder
        nearby = SpatialQueryUtils.find_nearby_stakeholders(
            point=center_point,
            radius_miles=10.0,
        )

        # Should find the nearby stakeholder
        assert len(nearby) >= 1
        assert self.stakeholder_inside in nearby
        # Should not find the distant stakeholder
        assert self.stakeholder_outside not in nearby

    def test_find_nearby_stakeholders_null_point(self) -> None:
        """Test finding stakeholders near a null point"""
        nearby = SpatialQueryUtils.find_nearby_stakeholders(point=None)
        assert len(nearby) == 0

    def test_get_district_statistics(self) -> None:
        """Test getting district statistics"""
        stats = SpatialQueryUtils.get_district_statistics()

        # Should return dict with district types
        assert isinstance(stats, dict)
        assert "congressional_districts" in stats
        assert "state_senate_districts" in stats
        assert "state_house_districts" in stats

        # Each should be a list of dicts with required fields
        for district_type in [
            "congressional_districts",
            "state_senate_districts",
            "state_house_districts",
        ]:
            assert isinstance(stats[district_type], list)
            if stats[district_type]:  # If there are districts
                district_stat = stats[district_type][0]
                assert "name" in district_stat
                assert "geoid" in district_stat
                assert "stakeholder_count" in district_stat

    def test_get_unassigned_stakeholders(self) -> None:
        """Test getting stakeholders with location but no district assignment"""
        # Create stakeholder with location but no congressional district
        unassigned = Stakeholder.objects.create(
            name="Unassigned Stakeholder",
            organization="Test Org",
            email="unassigned@example.com",
            street_address="789 Pine St",
            city="Denver",
            state="CO",
            zip_code="80202",
            location=Point(-104.9903, 39.7392),
            type="individual",
            # No district assignments
        )

        unassigned_list = SpatialQueryUtils.get_unassigned_stakeholders()

        # Should include the unassigned stakeholder
        assert unassigned in unassigned_list
        # Should not include stakeholders with district assignments
        assert self.stakeholder_inside not in unassigned_list
