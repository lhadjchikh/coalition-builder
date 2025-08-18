import logging
import os
from typing import TYPE_CHECKING

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError

from coalition.regions.models import Region
from coalition.stakeholders.constants import DistrictType
from coalition.stakeholders.spatial import SpatialQueryUtils
from coalition.stakeholders.validators import AddressValidator

if TYPE_CHECKING:
    from coalition.stakeholders.models import Stakeholder

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for geocoding addresses and assigning legislative districts"""

    # Minimum confidence score for accepting AWS Location results (0.0 to 1.0)
    AWS_LOCATION_CONFIDENCE_THRESHOLD = float(
        os.environ.get("AWS_LOCATION_CONFIDENCE_THRESHOLD", "0.7"),
    )

    def __init__(self) -> None:
        # Initialize AWS Location Service client
        self.location_client = None
        self.place_index_name = os.environ.get("AWS_LOCATION_PLACE_INDEX_NAME")

        if self.place_index_name:
            try:
                self.location_client = boto3.client(
                    "location",
                    region_name=os.environ.get("AWS_REGION", "us-east-1"),
                )
                logger.info(
                    f"AWS Location initialized: {self.place_index_name}",
                )
            except (NoCredentialsError, ClientError) as e:
                logger.error(f"Failed to initialize AWS Location Service: {e}")
                self.location_client = None
        else:
            logger.warning("AWS_LOCATION_PLACE_INDEX_NAME not configured")

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

            # Use AWS Location Service for geocoding
            if self.location_client and self.place_index_name:
                point = self._geocode_with_aws_location(validated)
                if point:
                    logger.info(f"Successfully geocoded with AWS Location: {validated}")
                    return point
                else:
                    logger.warning(f"AWS Location failed to geocode: {validated}")
            else:
                logger.error("AWS Location Service not available for geocoding")

            return None

        except ValidationError as e:
            logger.error(f"Address validation failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return None

    def get_address_suggestions(
        self,
        text: str,
        max_results: int = 5,
    ) -> list[dict[str, str]]:
        """
        Get address suggestions for autocomplete using AWS Location Service.
        Returns a list of suggested addresses with structured components.
        """
        if not self.location_client or not self.place_index_name:
            logger.warning("AWS Location Service not available for suggestions")
            return []

        try:
            response = self.location_client.search_place_index_for_suggestions(
                IndexName=self.place_index_name,
                Text=text,
                MaxResults=max_results,
                FilterCountries=["USA"],
                Language="en",
            )

            suggestions = []
            for result in response.get("Results", []):
                suggestion = {
                    "text": result.get("Text", ""),
                    "place_id": result.get("PlaceId", ""),
                }
                suggestions.append(suggestion)

            return suggestions

        except ClientError as e:
            logger.error(f"Failed to get address suggestions: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error getting suggestions: {e}")
            return []

    def get_place_details(self, place_id: str) -> dict[str, str] | None:
        """
        Get detailed address components for a specific place ID.
        Used after user selects a suggestion.
        """
        if not self.location_client or not self.place_index_name:
            logger.warning("AWS Location Service not available for place details")
            return None

        try:
            response = self.location_client.get_place(
                IndexName=self.place_index_name,
                PlaceId=place_id,
                Language="en",
            )

            place = response.get("Place", {})

            # Extract address components
            address_components = {
                "street_address": place.get("AddressNumber", "")
                + " "
                + place.get("Street", ""),
                "city": place.get("Municipality", ""),
                "state": place.get("Region", ""),
                "zip_code": place.get("PostalCode", ""),
                "country": place.get("Country", "USA"),
            }

            # Clean up street address
            address_components["street_address"] = address_components[
                "street_address"
            ].strip()

            return address_components

        except ClientError as e:
            logger.error(f"Failed to get place details: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting place details: {e}")
            return None

    def _geocode_with_aws_location(self, address_parts: dict[str, str]) -> Point | None:
        """Use AWS Location Service for geocoding (works via VPC endpoint)"""
        try:
            # Format address for AWS Location
            address_string = AddressValidator.format_address(
                address_parts["street_address"],
                address_parts["city"],
                address_parts["state"],
                address_parts["zip_code"],
            )

            # Search for the address using AWS Location Service
            if self.location_client is None:
                logger.warning("AWS Location client not available for geocoding")
                return None

            response = self.location_client.search_place_index_for_text(
                IndexName=self.place_index_name,
                Text=address_string,
                MaxResults=1,
                FilterCountries=["USA"],
                Language="en",
            )

            # Check if we got results
            if response.get("Results"):
                result = response["Results"][0]
                place = result.get("Place", {})
                geometry = place.get("Geometry", {})
                point = geometry.get("Point")

                if point and len(point) >= 2:
                    # AWS Location returns [longitude, latitude]
                    longitude, latitude = point[0], point[1]

                    # Check confidence score if available
                    relevance = result.get("Relevance", 1.0)
                    if relevance >= self.AWS_LOCATION_CONFIDENCE_THRESHOLD:
                        return Point(longitude, latitude, srid=4326)
                    else:
                        logger.info(
                            f"AWS Location result confidence too low: {relevance}",
                        )

            return None

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "ResourceNotFoundException":
                logger.error(
                    f"AWS Location place index not found: {self.place_index_name}",
                )
            else:
                logger.warning(f"AWS Location geocoding failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected AWS Location error: {e}")
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
