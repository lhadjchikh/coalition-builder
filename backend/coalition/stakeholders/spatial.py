from django.contrib.gis.db.models import Q
from django.contrib.gis.geos import Point

from coalition.regions.models import Region
from coalition.stakeholders.models import Stakeholder


class SpatialQueryManager:
    """Utility class for spatial queries related to stakeholders and districts"""

    @staticmethod
    def find_districts_for_point(point: Point) -> dict[str, Region | None]:
        """
        Find all legislative districts containing a given point

        Args:
            point: Geographic point to search for

        Returns:
            Dictionary with district types as keys and Region objects as values
        """
        if not point:
            return {
                "congressional_district": None,
                "state_senate_district": None,
                "state_house_district": None,
            }

        # Use a single query with OR conditions for efficiency
        districts = Region.objects.filter(
            Q(type="congressional_district")
            | Q(type="state_senate_district")
            | Q(type="state_house_district"),
            geom__contains=point,
        ).select_related()

        # Organize results by district type
        result = {
            "congressional_district": None,
            "state_senate_district": None,
            "state_house_district": None,
        }

        for district in districts:
            if district.type == "congressional_district":
                result["congressional_district"] = district
            elif district.type == "state_senate_district":
                result["state_senate_district"] = district
            elif district.type == "state_house_district":
                result["state_house_district"] = district

        return result

    @staticmethod
    def get_stakeholders_in_district(
        district: Region,
        include_unverified: bool = False,
    ) -> list[Stakeholder]:
        """
        Get all stakeholders within a specific district

        Args:
            district: Region object representing the district
            include_unverified: Whether to include stakeholders with unverified emails

        Returns:
            List of Stakeholder objects in the district
        """
        base_query = Stakeholder.objects.filter(location__within=district.geom)

        if not include_unverified:
            # Only include stakeholders with verified endorsements
            base_query = base_query.filter(endorsements__email_verified=True).distinct()

        return list(base_query.select_related().all())

    @staticmethod
    def get_stakeholders_by_district_type(
        district_type: str,
        state_filter: str | None = None,
    ) -> dict[str, list[Stakeholder]]:
        """
        Get stakeholders grouped by districts of a specific type

        Args:
            district_type: Type of district ('congressional_district',
                'state_senate_district', 'state_house_district')
            state_filter: Optional state abbreviation to filter by

        Returns:
            Dictionary with district names as keys and lists of stakeholders as values
        """
        # Get all districts of the specified type
        districts_query = Region.objects.filter(type=district_type)

        if state_filter:
            # For congressional districts, filter by state in the geoid
            if district_type == "congressional_district":
                districts_query = districts_query.filter(geoid__startswith=state_filter)
            # For state legislative districts, filter by parent state or geoid
            else:
                districts_query = districts_query.filter(
                    Q(parent__geoid=state_filter) | Q(geoid__startswith=state_filter),
                )

        result = {}

        for district in districts_query:
            # Get field name based on district type
            if district_type == "congressional_district":
                field_name = "congressional_district"
            elif district_type == "state_senate_district":
                field_name = "state_senate_district"
            elif district_type == "state_house_district":
                field_name = "state_house_district"
            else:
                continue

            # Get stakeholders assigned to this district
            stakeholders = (
                Stakeholder.objects.filter(**{field_name: district})
                .select_related()
                .all()
            )

            result[district.name] = list(stakeholders)

        return result

    @staticmethod
    def find_nearby_stakeholders(
        point: Point,
        radius_miles: float = 10.0,
    ) -> list[Stakeholder]:
        """
        Find stakeholders within a radius of a given point

        Args:
            point: Center point for search
            radius_miles: Search radius in miles

        Returns:
            List of nearby Stakeholder objects, ordered by distance
        """
        if not point:
            return []

        # Convert miles to meters for PostGIS
        radius_meters = radius_miles * 1609.344

        return list(
            Stakeholder.objects.filter(location__distance_lte=(point, radius_meters))
            .select_related(
                "congressional_district",
                "state_senate_district",
                "state_house_district",
            )
            .order_by("location__distance")  # Order by distance from point
            .all(),
        )

    @staticmethod
    def get_district_statistics() -> dict[str, dict]:
        """
        Get statistics about stakeholder distribution across districts

        Returns:
            Dictionary with district types and their stakeholder counts
        """
        from django.db.models import Count

        stats = {}

        # Congressional district statistics
        cd_stats = (
            Region.objects.filter(type="congressional_district")
            .annotate(stakeholder_count=Count("congressional_stakeholders"))
            .values("name", "geoid", "stakeholder_count")
            .order_by("-stakeholder_count")
        )
        stats["congressional_districts"] = list(cd_stats)

        # State senate chamber statistics
        senate_stats = (
            Region.objects.filter(type="state_senate_district")
            .annotate(stakeholder_count=Count("state_senate_stakeholders"))
            .values("name", "geoid", "stakeholder_count")
            .order_by("-stakeholder_count")
        )
        stats["state_senate_districts"] = list(senate_stats)

        # State house chamber statistics
        house_stats = (
            Region.objects.filter(type="state_house_district")
            .annotate(stakeholder_count=Count("state_house_stakeholders"))
            .values("name", "geoid", "stakeholder_count")
            .order_by("-stakeholder_count")
        )
        stats["state_house_districts"] = list(house_stats)

        return stats

    @staticmethod
    def get_unassigned_stakeholders() -> list[Stakeholder]:
        """
        Get stakeholders who have coordinates but haven't been assigned to districts

        Returns:
            List of Stakeholder objects needing district assignment
        """
        return list(
            Stakeholder.objects.filter(
                location__isnull=False,
                congressional_district__isnull=True,
            )
            .select_related()
            .all(),
        )
