import contextlib
import json
import os
import shutil
import tempfile
import zipfile
from typing import Any
from urllib.request import urlretrieve

try:
    from django.contrib.gis.gdal import DataSource
except ImportError:
    # GDAL not available - this is optional for docs builds
    DataSource = None
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from coalition.regions.constants import FIPS_TO_STATE
from coalition.regions.models import Region


class Command(BaseCommand):
    """
    Management command to import TIGER/Line shapefiles for legislative districts

    Usage:
        python manage.py import_tiger_data --type congressional --year 2024 --state MD
        python manage.py import_tiger_data --type state_senate --year 2024 --state MD
        python manage.py import_tiger_data --type state_house --year 2024 --state MD
    """

    help = (
        "Import TIGER/Line shapefiles for congressional and state legislative districts"
    )

    # TIGER/Line file URLs (2024 data) - for full resolution geometry
    TIGER_URLS = {
        "congressional": "https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_us_cd119.zip",
        "state_senate": "https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_{state}_sldu.zip",
        "state_house": "https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_{state}_sldl.zip",
        "counties": "https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip",
        "states": "https://www2.census.gov/geo/tiger/TIGER2024/STATE/tl_2024_us_state.zip",
    }

    # Cartographic boundary file URLs (2024 data) - for simplified geometry
    CARTO_URLS = {
        "congressional": "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_cd119_500k.zip",
        "state_senate": "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_{state}_sldu_500k.zip",
        "state_house": "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_{state}_sldl_500k.zip",
        "counties": "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_county_500k.zip",
        "states": "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_state_500k.zip",
    }

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--type",
            type=str,
            required=True,
            choices=[
                "congressional",
                "state_senate",
                "state_house",
                "counties",
                "states",
            ],
            help="Type of districts to import",
        )

        parser.add_argument(
            "--year",
            type=int,
            default=2024,
            help="Year of TIGER/Line data (default: 2024)",
        )

        parser.add_argument(
            "--state",
            type=str,
            help=(
                "State FIPS code (required for state legislative districts, "
                'e.g., "24" for Maryland)'
            ),
        )

        parser.add_argument(
            "--file",
            type=str,
            help="Local path to shapefile (alternative to downloading)",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be imported without actually importing",
        )

        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data of this type before importing",
        )

    def _validate_gdal_availability(self) -> None:
        """Check if GDAL is available."""
        if DataSource is None:
            msg = "GDAL is required for this command. "
            msg += "Install with: poetry install --with gis"
            raise CommandError(msg)

    def _validate_state_requirement(
        self,
        district_type: str,
        state_fips: str | None,
        local_file: str | None,
    ) -> None:
        """Validate state requirement for state legislative districts."""
        if (
            district_type in ["state_senate", "state_house"]
            and not state_fips
            and not local_file
        ):
            raise CommandError(
                f"State FIPS code is required for {district_type} districts. "
                "Use --state option (e.g., --state 24 for Maryland)",
            )

    def _cleanup_temp_files(
        self,
        tiger_path: str,
        carto_path: str | None,
        local_file: str | None,
    ) -> None:
        """Clean up downloaded temporary files."""
        if not local_file:
            for path in [tiger_path, carto_path]:
                if path:
                    try:
                        # Remove the shapefile
                        os.unlink(path)
                        # Remove the parent directory
                        parent_dir = os.path.dirname(path)
                        if parent_dir and os.path.exists(parent_dir):
                            shutil.rmtree(parent_dir)
                    except OSError:
                        pass

    def _process_import(
        self,
        tiger_path: str,
        carto_path: str | None,
        district_type: str,
        dry_run: bool,
    ) -> int:
        """Process the import of shapefile data."""
        imported_count = self._import_shapefile(
            tiger_path,
            carto_path,
            district_type,
            dry_run,
        )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"DRY RUN: Would import {imported_count} "
                    f"{district_type} districts",
                ),
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully imported {imported_count} "
                    f"{district_type} districts",
                ),
            )

        return imported_count

    def _get_shapefile_paths(
        self,
        district_type: str,
        year: int,
        state_fips: str | None,
        local_file: str | None,
    ) -> tuple[str, str | None]:
        """Get or download shapefile paths."""
        if local_file:
            return local_file, None
        else:
            return self._download_shapefiles(district_type, year, state_fips)

    def handle(self, **options: Any) -> None:
        # Validate prerequisites
        self._validate_gdal_availability()

        district_type = options["type"]
        year = options["year"]
        state_fips = options.get("state")
        local_file = options.get("file")
        dry_run = options["dry_run"]
        clear_existing = options["clear"]

        # Validate inputs
        self._validate_state_requirement(district_type, state_fips, local_file)

        # Clear existing data if requested
        if clear_existing and not dry_run:
            self._clear_existing_data(district_type)

        # Get or download shapefiles
        tiger_path, carto_path = self._get_shapefile_paths(
            district_type,
            year,
            state_fips,
            local_file,
        )

        try:
            self._process_import(tiger_path, carto_path, district_type, dry_run)

        finally:
            self._cleanup_temp_files(tiger_path, carto_path, local_file)

    def _clear_existing_data(self, district_type: str) -> None:
        """Clear existing regions of the specified type"""
        type_mapping = {
            "congressional": "congressional_district",
            "state_senate": "state_senate_district",
            "state_house": "state_house_district",
            "counties": "county",
            "states": "state",
        }

        region_type = type_mapping[district_type]
        deleted_count = Region.objects.filter(type=region_type).delete()[0]

        self.stdout.write(
            self.style.WARNING(
                f"Cleared {deleted_count} existing {district_type} regions",
            ),
        )

    def _download_shapefiles(
        self,
        district_type: str,
        year: int,
        state_fips: str | None,
    ) -> tuple[str, str | None]:
        """Download TIGER/Line and cartographic boundary shapefiles"""

        # Download TIGER/Line file
        tiger_url_template = self.TIGER_URLS[district_type]
        tiger_path = self._download_shapefile(
            tiger_url_template,
            year,
            state_fips,
            "TIGER/Line",
        )

        # Download cartographic boundary file
        carto_url_template = self.CARTO_URLS[district_type]
        try:
            carto_path = self._download_shapefile(
                carto_url_template,
                year,
                state_fips,
                "Cartographic boundary",
            )
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(
                    f"Failed to download cartographic boundary file: {e}\n"
                    "Will use simplified TIGER/Line geometry instead",
                ),
            )
            carto_path = None

        return tiger_path, carto_path

    def _download_shapefile(
        self,
        url_template: str,
        year: int,
        state_fips: str | None,
        file_type: str,
    ) -> str:
        """Download and extract a single shapefile"""

        # Format URL with state if needed
        if state_fips:
            url = url_template.format(state=state_fips.zfill(2))
        else:
            url = url_template

        # Update year in URL if different from 2023
        if year != 2023:
            url = url.replace("2023", str(year))
            url = url.replace("GENZ2023", f"GENZ{year}")

        self.stdout.write(f"Downloading {file_type} file: {url}...")

        # Download to temporary file
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_file:
            try:
                urlretrieve(url, temp_file.name)
                zip_path = temp_file.name
            except Exception as e:
                raise CommandError(f"Failed to download {url}: {e}") from e

        # Extract shapefile
        try:
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                # Find the .shp file in the archive
                shp_files = [f for f in zip_ref.namelist() if f.endswith(".shp")]
                if not shp_files:
                    raise CommandError("No .shp file found in downloaded archive")

                # Extract to temporary directory
                temp_dir = tempfile.mkdtemp()
                zip_ref.extractall(temp_dir)

                # Return path to the .shp file
                shapefile_path = os.path.join(temp_dir, shp_files[0])

                if not os.path.exists(shapefile_path):
                    raise CommandError(
                        f"Extracted shapefile not found: {shapefile_path}",
                    )

                self.stdout.write(
                    f"Extracted {file_type} shapefile to {shapefile_path}",
                )
                return shapefile_path

        finally:
            # Clean up zip file
            with contextlib.suppress(OSError):
                os.unlink(zip_path)

    def _import_shapefile(  # noqa: C901
        self,
        tiger_path: str,
        carto_path: str | None,
        district_type: str,
        dry_run: bool,
    ) -> int:
        """Import data from shapefiles"""

        # Type mapping
        type_mapping = {
            "congressional": "congressional_district",
            "state_senate": "state_senate_district",
            "state_house": "state_house_district",
            "counties": "county",
            "states": "state",
        }

        region_type = type_mapping[district_type]

        # Open the TIGER/Line shapefile
        try:
            tiger_source = DataSource(tiger_path)
            tiger_layer = tiger_source[0]
        except Exception as e:
            raise CommandError(f"Failed to open TIGER/Line shapefile: {e}") from e

        # Open the cartographic boundary shapefile if available
        carto_layer = None
        carto_features = {}
        if carto_path:
            try:
                carto_source = DataSource(carto_path)
                carto_layer = carto_source[0]

                # Build a lookup dict for cartographic features by GEOID
                for feature in carto_layer:
                    geoid = feature.get("GEOID")
                    if geoid:
                        carto_features[geoid] = feature

                self.stdout.write(
                    f"Loaded {len(carto_features)} cartographic boundary features",
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"Failed to open cartographic boundary file: {e}",
                    ),
                )

        self.stdout.write(
            f"Processing {len(tiger_layer)} features from TIGER/Line shapefile...",
        )

        imported_count = 0

        with transaction.atomic():
            for feature in tiger_layer:
                try:
                    # Extract TIGER/Line geometry for full resolution
                    tiger_geom = GEOSGeometry(feature.geom.wkt, srid=4326)

                    # Ensure MultiPolygon
                    if tiger_geom.geom_type == "Polygon":
                        tiger_geom = MultiPolygon(tiger_geom)

                    # Extract attributes based on district type
                    region_data = self._extract_region_data(feature, district_type)

                    if not region_data:
                        continue

                    # Get cartographic boundary geometry if available
                    carto_geom = None
                    if carto_features and region_data["geoid"] in carto_features:
                        carto_feature = carto_features[region_data["geoid"]]
                        try:
                            carto_geom = GEOSGeometry(carto_feature.geom.wkt, srid=4326)
                            if carto_geom.geom_type == "Polygon":
                                carto_geom = MultiPolygon(carto_geom)
                        except Exception as e:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"  Failed to process cartographic geometry for "
                                    f"{region_data['geoid']}: {e}",
                                ),
                            )

                    # Use cartographic boundary for GeoJSON if available,
                    # otherwise simplify TIGER/Line geometry
                    if carto_geom:
                        geojson_data = json.loads(carto_geom.geojson)
                    else:
                        simplified_geom = tiger_geom.simplify(0.001)
                        geojson_data = json.loads(simplified_geom.geojson)

                    if dry_run:
                        self.stdout.write(
                            f"  Would import: {region_data['name']} "
                            f"(GEOID: {region_data['geoid']})",
                        )
                    else:
                        # Create or update region
                        region, created = Region.objects.update_or_create(
                            geoid=region_data["geoid"],
                            type=region_type,
                            defaults={
                                "name": region_data["name"],
                                "label": region_data.get("label", ""),
                                "abbrev": region_data.get("abbrev", ""),
                                "coords": tiger_geom.centroid,
                                "geom": tiger_geom,  # Full resolution geometry
                                "geojson": geojson_data,  # Cartographic boundary
                            },
                        )

                        action = "Created" if created else "Updated"
                        self.stdout.write(
                            f"  {action}: {region.name} (GEOID: {region.geoid})",
                        )

                    imported_count += 1

                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f"  Failed to process feature: {e}"),
                    )
                    continue

        return imported_count

    def _extract_region_data(  # noqa: C901
        self,
        feature: Any,
        district_type: str,
    ) -> dict[str, str] | None:
        """Extract region data from shapefile feature based on district type"""

        if district_type == "congressional":
            # Congressional districts
            geoid = feature.get("GEOID")
            cd_code = feature.get("CD119FP")
            state_fips = feature.get("STATEFP")

            if not all([geoid, cd_code, state_fips]):
                return None

            # Format name
            if cd_code == "00":
                name = f"At-Large Congressional District (State {state_fips})"
            else:
                name = f"Congressional District {int(cd_code)} (State {state_fips})"

            # Get state abbreviation from FIPS code
            state_abbrev = self._get_state_abbrev(state_fips)
            abbrev = (
                f"{state_abbrev}-{cd_code.zfill(2)}"
                if state_abbrev
                else f"CD-{cd_code}"
            )

            return {
                "geoid": geoid,
                "name": name,
                "label": f"CD-{cd_code}",
                "abbrev": abbrev,
            }

        elif district_type == "state_senate":
            # State senate districts
            geoid = feature.get("GEOID")
            district_code = feature.get("SLDUST")
            state_fips = feature.get("STATEFP")

            if not all([geoid, district_code, state_fips]):
                return None

            # Get state abbreviation from FIPS code
            state_abbrev = self._get_state_abbrev(state_fips)
            abbrev = (
                f"{state_abbrev}-SD-{district_code}"
                if state_abbrev
                else f"SD-{district_code}"
            )

            return {
                "geoid": geoid,
                "name": f"State Senate District {district_code} (State {state_fips})",
                "label": f"SD-{district_code}",
                "abbrev": abbrev,
            }

        elif district_type == "state_house":
            # State house districts
            geoid = feature.get("GEOID")
            district_code = feature.get("SLDLST")
            state_fips = feature.get("STATEFP")

            if not all([geoid, district_code, state_fips]):
                return None

            # Get state abbreviation from FIPS code
            state_abbrev = self._get_state_abbrev(state_fips)
            abbrev = (
                f"{state_abbrev}-HD-{district_code}"
                if state_abbrev
                else f"HD-{district_code}"
            )

            return {
                "geoid": geoid,
                "name": f"State House District {district_code} (State {state_fips})",
                "label": f"HD-{district_code}",
                "abbrev": abbrev,
            }

        elif district_type == "counties":
            # Counties
            geoid = feature.get("GEOID")
            name = feature.get("NAME")
            state_fips = feature.get("STATEFP")

            if not all([geoid, name, state_fips]):
                return None

            # Get state abbreviation from FIPS code
            state_abbrev = self._get_state_abbrev(state_fips)
            abbrev = f"{state_abbrev}-{name}" if state_abbrev else name

            return {
                "geoid": geoid,
                "name": f"{name} County, State {state_fips}",
                "label": name,
                "abbrev": abbrev,
            }

        elif district_type == "states":
            # States
            geoid = feature.get("GEOID")
            name = feature.get("NAME")
            state_abbr = feature.get("STUSPS")

            if not all([geoid, name, state_abbr]):
                return None

            return {
                "geoid": geoid,
                "name": name,
                "label": state_abbr,
                "abbrev": state_abbr,
            }

        return None

    def _get_state_abbrev(self, state_fips: str) -> str | None:
        """Map FIPS state code to state abbreviation"""
        return FIPS_TO_STATE.get(state_fips)
