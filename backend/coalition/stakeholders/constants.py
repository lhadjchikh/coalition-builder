from enum import StrEnum


class DistrictType(StrEnum):
    """Enumeration of district types for stakeholder assignment and spatial queries"""

    CONGRESSIONAL = "congressional_district"
    STATE_SENATE = "state_senate_district"
    STATE_HOUSE = "state_house_district"

    @classmethod
    def get_field_name(cls, district_type: str) -> str:
        """
        Get the corresponding field name for a district type.
        Since field names match district type values, this is a simple validation.

        Args:
            district_type: The district type string

        Returns:
            The field name for the district type

        Raises:
            ValueError: If district_type is not a valid DistrictType
        """
        # Validate that it's a valid district type
        cls(district_type)  # Raises ValueError if invalid
        return district_type

    @classmethod
    def get_display_name(cls, district_type: str) -> str:
        """
        Get a human-readable display name for a district type.

        Args:
            district_type: The district type string

        Returns:
            Human-readable display name
        """
        display_names = {
            cls.CONGRESSIONAL: "Congressional District",
            cls.STATE_SENATE: "State Senate District",
            cls.STATE_HOUSE: "State House District",
        }
        return display_names.get(
            cls(district_type),
            district_type.replace("_", " ").title(),
        )
