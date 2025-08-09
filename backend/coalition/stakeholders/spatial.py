from typing import Any

from django.contrib.gis.db.models import Q
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.db.models import Count

from coalition.regions.constants import STATE_TO_FIPS
from coalition.regions.models import Region
from coalition.stakeholders.constants import DistrictType
from coalition.stakeholders.models import Stakeholder


class SpatialQueryUtils:
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
            Q(type=DistrictType.CONGRESSIONAL)
            | Q(type=DistrictType.STATE_SENATE)
            | Q(type=DistrictType.STATE_HOUSE),
            geom__contains=point,
        )

        # Organize results by district type using string keys
        result: dict[str, Region | None] = {
            DistrictType.CONGRESSIONAL.value: None,
            DistrictType.STATE_SENATE.value: None,
            DistrictType.STATE_HOUSE.value: None,
        }

        for district in districts:
            if district.type in DistrictType:
                # district.type is a DistrictType enum value
                result[district.type] = district

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
        # Use foreign key relationship for efficiency
        if district.type in DistrictType:
            # Use direct field mapping since field names match district types
            filter_kwargs: dict[str, Any] = {district.type: district}
        else:
            # Fall back to spatial query for other district types
            filter_kwargs = {"location__within": district.geom}

        base_query = Stakeholder.objects.filter(**filter_kwargs)

        if not include_unverified:
            # Only include stakeholders with verified endorsements
            base_query = base_query.filter(endorsements__email_verified=True).distinct()

        return list(base_query.all())

    @staticmethod
    def get_stakeholders_by_district_type(
        district_type: DistrictType | str,
        state_filter: str | None = None,
    ) -> dict[str, list[Stakeholder]]:
        """
        Get stakeholders grouped by districts of a specific type

        Args:
            district_type: Type of district (DistrictType enum or string)
            state_filter: Optional state abbreviation to filter by

        Returns:
            Dictionary with district names as keys and lists of stakeholders as values
        """
        # Ensure district_type is a valid DistrictType
        if isinstance(district_type, str):
            district_type = DistrictType(district_type)

        # Get all districts of the specified type
        districts_query = Region.objects.filter(type=district_type)

        if state_filter:
            # Convert state abbreviation to FIPS code if needed
            fips_code = STATE_TO_FIPS.get(state_filter, state_filter)

            if district_type == DistrictType.CONGRESSIONAL:
                # Filter congressional districts by state FIPS code in geoid
                districts_query = districts_query.filter(
                    geoid__startswith=fips_code,
                )
            else:
                # For state legislative districts, filter by parent state or geoid
                districts_query = districts_query.filter(
                    Q(parent__geoid=fips_code) | Q(geoid__startswith=fips_code),
                )

        result = {}

        for district in districts_query:
            # Skip districts that don't match our target type
            if district.type != district_type:
                continue

            # Get stakeholders assigned to this district
            # Field name matches district type value
            stakeholders = Stakeholder.objects.filter(**{district.type: district}).all()

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
            .annotate(distance=Distance("location", point))
            .order_by("distance")
            .all(),
        )

    @staticmethod
    def get_district_statistics() -> dict[str, list[dict[str, Any]]]:
        """
        Get statistics about stakeholder distribution across districts

        Returns:
            Dictionary with district types and their stakeholder counts
        """
        stats = {}

        # Generate statistics for each district type
        district_stats_mapping = {
            DistrictType.CONGRESSIONAL: (
                "congressional_stakeholders",
                "congressional_districts",
            ),
            DistrictType.STATE_SENATE: (
                "state_senate_stakeholders",
                "state_senate_districts",
            ),
            DistrictType.STATE_HOUSE: (
                "state_house_stakeholders",
                "state_house_districts",
            ),
        }

        for district_type, (related_name, stats_key) in district_stats_mapping.items():
            district_stats = (
                Region.objects.filter(type=district_type)
                .annotate(stakeholder_count=Count(related_name))
                .values("name", "geoid", "stakeholder_count")
                .order_by("-stakeholder_count")
            )
            stats[stats_key] = list(district_stats)

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
            ).all(),
        )
