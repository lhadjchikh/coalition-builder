import time
from typing import Any

from django.core.management.base import BaseCommand
from django.db.models import QuerySet

from coalition.stakeholders.models import Stakeholder
from coalition.stakeholders.services import GeocodingService


class Command(BaseCommand):
    """
    Management command to geocode stakeholder addresses and assign legislative districts

    Usage:
        python manage.py geocode_stakeholders
        python manage.py geocode_stakeholders --retry-failed
        python manage.py geocode_stakeholders --limit 100
        python manage.py geocode_stakeholders --state MD
    """

    help = "Geocode stakeholder addresses and assign legislative districts"

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--retry-failed",
            action="store_true",
            help="Retry geocoding for stakeholders that previously failed",
        )

        parser.add_argument(
            "--limit",
            type=int,
            help="Maximum number of stakeholders to process",
        )

        parser.add_argument(
            "--state",
            type=str,
            help="Process only stakeholders from specific state (e.g., MD, CA)",
        )

        parser.add_argument(
            "--delay",
            type=float,
            default=0.1,
            help="Delay between geocoding requests in seconds (default: 0.1)",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be geocoded without actually geocoding",
        )

    def handle(self, **options: Any) -> None:  # noqa: C901
        retry_failed = options["retry_failed"]
        limit = options.get("limit")
        state_filter = options.get("state")
        delay = options["delay"]
        dry_run = options["dry_run"]

        # Build query for stakeholders to geocode
        query = self._build_stakeholder_query(retry_failed, state_filter)

        # Get stakeholders to process
        stakeholders = query.order_by("created_at")
        if limit:
            stakeholders = stakeholders[:limit]

        total_count = stakeholders.count()

        if total_count == 0:
            self.stdout.write(
                self.style.WARNING("No stakeholders found matching criteria"),
            )
            return

        self.stdout.write(f"Found {total_count} stakeholders to process")

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"DRY RUN: Would geocode {total_count} stakeholders",
                ),
            )
            for i, stakeholder in enumerate(stakeholders[:10]):  # Show first 10
                address_info = stakeholder.full_address or "Incomplete address"
                self.stdout.write(f"  {i+1}. {stakeholder.name} - {address_info}")
            if total_count > 10:
                self.stdout.write(f"  ... and {total_count - 10} more")
            return

        # Initialize geocoding service
        geocoding_service = GeocodingService()

        # Process stakeholders
        success_count = 0
        failure_count = 0

        for i, stakeholder in enumerate(stakeholders, 1):
            self.stdout.write(
                f"Processing {i}/{total_count}: {stakeholder.name} "
                f"({stakeholder.email})",
            )

            try:
                geocoding_service.geocode_and_assign_districts(stakeholder)

                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ Geocoded: {stakeholder.latitude}, "
                        f"{stakeholder.longitude}",
                    ),
                )

                # Show assigned districts
                districts = []
                if stakeholder.congressional_district:
                    districts.append(
                        f"CD: {stakeholder.congressional_district.name}",
                    )
                if stakeholder.state_senate_district:
                    districts.append(
                        f"Senate: {stakeholder.state_senate_district.name}",
                    )
                if stakeholder.state_house_district:
                    districts.append(
                        f"House: {stakeholder.state_house_district.name}",
                    )

                if districts:
                    self.stdout.write(f"    Districts: {', '.join(districts)}")

                success_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error geocoding: {e}"))
                failure_count += 1

            # Add delay to avoid overwhelming geocoding services
            if delay > 0 and i < total_count:
                time.sleep(delay)

        # Summary
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Geocoding complete: {success_count} successful, "
                f"{failure_count} failed out of {total_count} total",
            ),
        )

        if failure_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    "Use --retry-failed to retry geocoding for failed addresses",
                ),
            )

    def _build_stakeholder_query(
        self,
        retry_failed: bool,  # noqa: ARG002
        state_filter: str | None,
    ) -> QuerySet:
        """Build query for stakeholders to geocode"""

        # All stakeholders have complete addresses now, so just check for missing
        # location
        query = Stakeholder.objects.filter(location__isnull=True)

        # Filter by state if provided
        if state_filter:
            query = query.filter(state__iexact=state_filter)

        return query.select_related(
            "congressional_district",
            "state_senate_district",
            "state_house_district",
        )
