import logging
from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.db import connection
from geopy.exc import GeocoderServiceError, GeocoderTimedOut
from geopy.geocoders import Nominatim

from coalition.regions.models import Region
from coalition.stakeholders.constants import DistrictType
from coalition.stakeholders.spatial import SpatialQueryUtils
from coalition.stakeholders.validators import AddressValidator

if TYPE_CHECKING:
    from coalition.stakeholders.models import Stakeholder

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for geocoding addresses and assigning legislative districts"""

    def __init__(self) -> None:
        # Initialize Nominatim geocoder as fallback
        self.nominatim = Nominatim(user_agent="coalition-builder")

    def geocode_address(
        self,
        street_address: str,
        city: str,
        state: str,
        zip_code: str,
    ) -> Point | None:
        """
        Geocode an address using PostGIS Tiger geocoder first,
        then fall back to Nominatim if needed
        """
        try:
            # Validate address components first
            validated = AddressValidator.validate_complete_address(
                street_address,
                city,
                state,
                zip_code,
            )

            # Try PostGIS Tiger geocoder first (most accurate for US addresses)
            point = self._geocode_with_tiger(validated)
            if point:
                logger.info(f"Successfully geocoded with Tiger: {validated}")
                return point

            # Fall back to Nominatim
            point = self._geocode_with_nominatim(validated)
            if point:
                logger.info(f"Successfully geocoded with Nominatim: {validated}")
                return point

            logger.warning(f"Failed to geocode address: {validated}")
            return None

        except ValidationError as e:
            logger.error(f"Address validation failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return None

    def _geocode_with_tiger(self, address_parts: dict[str, str]) -> Point | None:
        """Use PostGIS Tiger geocoder for US addresses"""
        try:
            with connection.cursor() as cursor:
                # Check if geocode function exists before using it
                cursor.execute(
                    """
                    SELECT EXISTS(
                        SELECT 1 FROM information_schema.routines 
                        WHERE routine_name = 'geocode' 
                        AND routine_schema = 'tiger'
                    )
                    """,
                )
                if not cursor.fetchone()[0]:
                    logger.info("Tiger geocode function not available")
                    return None

                # Format address for Tiger geocoder
                address_string = (
                    f"{address_parts['street_address']}, "
                    f"{address_parts['city']}, "
                    f"{address_parts['state']} "
                    f"{address_parts['zip_code']}"
                )

                # Use PostGIS geocode function
                cursor.execute(
                    """
                    SELECT 
                        ST_X(geomout) as longitude, 
                        ST_Y(geomout) as latitude,
                        rating
                    FROM geocode(%s, 1)
                    WHERE rating >= 0
                    ORDER BY rating 
                    LIMIT 1
                """,
                    [address_string],
                )

                result = cursor.fetchone()
                if result:
                    longitude, latitude, rating = result
                    # Only accept results with reasonable confidence
                    # Tiger rating: lower is better (0 = exact match, 100 = no match)
                    if rating <= settings.TIGER_GEOCODING_CONFIDENCE_THRESHOLD:
                        return Point(longitude, latitude, srid=4326)

            return None

        except Exception as e:
            logger.warning(f"Tiger geocoding failed: {e}")
            return None

    def _geocode_with_nominatim(self, address_parts: dict[str, str]) -> Point | None:
        """Use Nominatim as fallback geocoder"""
        try:
            # Format address for Nominatim
            address_string = AddressValidator.format_address(
                address_parts["street_address"],
                address_parts["city"],
                address_parts["state"],
                address_parts["zip_code"],
            )

            # Add country for better results
            address_string += ", USA"

            location = self.nominatim.geocode(
                address_string,
                timeout=10,
                country_codes=["us"],
            )

            if location:
                return Point(location.longitude, location.latitude, srid=4326)

            return None

        except (GeocoderTimedOut, GeocoderServiceError) as e:
            logger.warning(f"Nominatim geocoding failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected Nominatim error: {e}")
            return None

    def assign_legislative_districts(self, point: Point) -> dict[str, Region | None]:
        """
        Find congressional and state legislative districts for a given point
        using spatial queries
        """
        try:
            return SpatialQueryUtils.find_districts_for_point(point)
        except Exception as e:
            logger.error(f"District assignment failed: {e}")
            return {
                DistrictType.CONGRESSIONAL: None,
                DistrictType.STATE_SENATE: None,
                DistrictType.STATE_HOUSE: None,
            }

    def geocode_and_assign_districts(
        self,
        stakeholder: "Stakeholder",
        update_fields: bool = True,
    ) -> bool:
        """
        Geocode stakeholder address and assign legislative districts
        Assumes all stakeholders have complete addresses

        Returns:
            True if geocoding and district assignment succeeded, False otherwise
        """
        # Geocode the address
        point = self.geocode_address(
            stakeholder.street_address,
            stakeholder.city,
            stakeholder.state,
            stakeholder.zip_code,
        )

        if not point:
            logger.warning(
                f"Failed to geocode address for stakeholder {stakeholder.id}",
            )
            return False

        if update_fields:
            try:
                # Update location and assign districts
                districts = self.assign_legislative_districts(point)

                stakeholder.location = point
                stakeholder.congressional_district = districts["congressional_district"]
                stakeholder.state_senate_district = districts["state_senate_district"]
                stakeholder.state_house_district = districts["state_house_district"]

                stakeholder.save(
                    update_fields=[
                        "location",
                        "congressional_district",
                        "state_senate_district",
                        "state_house_district",
                    ],
                )
            except Exception as e:
                logger.error(
                    f"Failed to save geocoded stakeholder {stakeholder.id}: {e}",
                )
                return False

        return True
