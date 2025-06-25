# Geocoding Quick Reference

Quick reference for developers working with the address validation and geocoding system.

## Code Examples

### Basic Address Validation

```python
from coalition.stakeholders.validators import AddressValidator

# Validate individual components
try:
    state = AddressValidator.validate_state("md")  # Returns "MD"
    zip_code = AddressValidator.validate_zip_code("21201")  # Returns "21201"
    city = AddressValidator.validate_city("baltimore")  # Returns "Baltimore"
except ValidationError as e:
    print(f"Validation error: {e}")

# Validate complete address
try:
    address = AddressValidator.validate_complete_address(
        street_address="123 Main St",
        city="Baltimore",
        state="MD",
        zip_code="21201"
    )
    print(f"Valid address: {address}")
except ValidationError as e:
    print(f"Address validation failed: {e}")
```

### Geocoding a Stakeholder

```python
from coalition.stakeholders.services import GeocodingService
from coalition.stakeholders.models import Stakeholder

# Create stakeholder
stakeholder = Stakeholder.objects.create(
    name="John Doe",
    email="john@example.com",
    street_address="123 Main St",
    city="Baltimore",
    state="MD",
    zip_code="21201",
    type="individual"
)

# Geocode and assign districts
service = GeocodingService()
success = service.geocode_and_assign_districts(stakeholder)

if success:
    print(f"Geocoded to: {stakeholder.latitude}, {stakeholder.longitude}")
    print(f"District: {stakeholder.congressional_district.abbrev}")
else:
    print("Geocoding failed")
```

### Spatial Queries

```python
from coalition.stakeholders.spatial import SpatialQueryUtils
from django.contrib.gis.geos import Point

utils = SpatialQueryUtils()

# Find stakeholders near a point
nearby = utils.find_stakeholders_near_point(
    latitude=39.2904,
    longitude=-76.6122,
    distance_km=5
)
print(f"Found {len(nearby)} nearby stakeholders")

# Get stakeholders by district type
by_district = utils.get_stakeholders_by_district(
    district_type="congressional_district",
    state_filter="MD"
)
for district_name, stakeholders in by_district.items():
    print(f"{district_name}: {len(stakeholders)} stakeholders")

# Find district for a point
point = Point(-76.6122, 39.2904)
district = utils.find_district_for_point(point, "congressional_district")
print(f"Point is in: {district.name if district else 'Unknown district'}")
```

### Management Commands

```bash
# Geocode all stakeholders with complete addresses
python manage.py geocode_stakeholders

# Geocode only Maryland stakeholders
python manage.py geocode_stakeholders --state MD

# Retry failed geocoding attempts
python manage.py geocode_stakeholders --retry-failed

# Limit to 50 stakeholders with 2 second delay
python manage.py geocode_stakeholders --limit 50 --delay 2

# Dry run to see what would be geocoded
python manage.py geocode_stakeholders --dry-run

# Import congressional districts
python manage.py import_tiger_data --type congressional --year 2024

# Import Maryland state legislative districts
python manage.py import_tiger_data --type state_senate --state 24
python manage.py import_tiger_data --type state_house --state 24

# Clear existing data before importing
python manage.py import_tiger_data --type congressional --clear
```

### API Usage

```bash
# Create stakeholder with address
curl -X POST http://localhost:8000/api/stakeholders/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "street_address": "456 Oak Ave",
    "city": "Austin",
    "state": "TX",
    "zip_code": "78701",
    "type": "individual"
  }'

# Get stakeholders from Maryland
curl "http://localhost:8000/api/stakeholders/?state=MD"

# Get stakeholders in specific congressional district
curl "http://localhost:8000/api/stakeholders/?congressional_district=45"

# Find stakeholders near a point (within 10km)
curl "http://localhost:8000/api/stakeholders/?near_lat=39.2904&near_lng=-76.6122&distance_km=10"

# Validate address without creating stakeholder
curl -X POST http://localhost:8000/api/stakeholders/validate-address/ \
  -H "Content-Type: application/json" \
  -d '{
    "street_address": "123 Main St",
    "city": "Baltimore",
    "state": "MD",
    "zip_code": "21201"
  }'

# Manual geocoding for existing stakeholder
curl -X POST http://localhost:8000/api/stakeholders/123/geocode/

# Export stakeholders to CSV with address data
curl "http://localhost:8000/api/stakeholders/export/csv/?state=MD"
```

## Model Fields Reference

### Stakeholder Model

```python
# Address fields
stakeholder.street_address  # CharField(max_length=255, blank=True)
stakeholder.city           # CharField(max_length=100, blank=True)
stakeholder.state          # CharField(max_length=2, blank=True, db_index=True)
stakeholder.zip_code       # CharField(max_length=10, blank=True)
stakeholder.county         # CharField(max_length=100, blank=True)

# Geographic fields
stakeholder.location       # PointField(geography=True, spatial_index=True)

# District relationships (ForeignKey to Region)
stakeholder.congressional_district    # Congressional district
stakeholder.state_senate_district     # State senate district
stakeholder.state_house_district      # State house district

# Helper properties
stakeholder.has_complete_address  # Boolean property
stakeholder.full_address         # String property
stakeholder.latitude            # Float property (from location)
stakeholder.longitude           # Float property (from location)
```

### Region Model

```python
# Basic fields
region.geoid      # CharField(max_length=20) - Census GEOID
region.name       # CharField(max_length=255) - Full name
region.abbrev     # CharField(max_length=10) - Abbreviation (e.g., "MD-03")
region.type       # CharField(max_length=30) - District type
region.label      # CharField(max_length=100) - Short label

# Geographic fields
region.coords     # PointField - Centroid coordinates
region.geom       # MultiPolygonField - Full boundary geometry
region.geojson    # JSONField - Simplified boundary for maps

# District types
"state"                    # US States
"county"                   # Counties
"congressional_district"   # Congressional Districts
"state_district_upper"     # State Senate Districts
"state_district_lower"     # State House Districts
```

## Common Patterns

### Check if Stakeholder Needs Geocoding

```python
# Find stakeholders that need geocoding
needs_geocoding = Stakeholder.objects.filter(
    # Has complete address
    street_address__isnull=False,
    city__isnull=False,
    state__isnull=False,
    zip_code__isnull=False,
    # But no location data
    location__isnull=True,
    # And hasn't failed previously
    geocoding_failed=False
).exclude(
    street_address="",
    city="",
    state="",
    zip_code=""
)
```

### Bulk Geocoding with Error Handling

```python
from django.db import transaction
import time

def geocode_stakeholders_bulk(stakeholders, delay=1):
    """Geocode stakeholders with error handling and rate limiting"""
    service = GeocodingService()

    for i, stakeholder in enumerate(stakeholders):
        try:
            with transaction.atomic():
                success = service.geocode_and_assign_districts(stakeholder)
                print(f"Stakeholder {stakeholder.id}: {'Success' if success else 'Failed'}")
        except Exception as e:
            print(f"Error geocoding stakeholder {stakeholder.id}: {e}")

        # Rate limiting
        if delay and i < len(stakeholders) - 1:
            time.sleep(delay)
```

### Filter Stakeholders by Geographic Criteria

```python
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

# Stakeholders in Maryland
md_stakeholders = Stakeholder.objects.filter(state="MD")

# Stakeholders with location data
geocoded = Stakeholder.objects.filter(location__isnull=False)

# Stakeholders in specific congressional district
district_stakeholders = Stakeholder.objects.filter(
    congressional_district__abbrev="MD-03"
)

# Stakeholders within 10km of Baltimore
baltimore = Point(-76.6122, 39.2904, srid=4326)
nearby = Stakeholder.objects.filter(
    location__distance_lte=(baltimore, D(km=10))
)

# Failed geocoding attempts
failed = Stakeholder.objects.filter(geocoding_failed=True)
```

### Custom Address Formatting

```python
def format_stakeholder_address(stakeholder):
    """Format stakeholder address for display"""
    parts = []

    if stakeholder.street_address:
        parts.append(stakeholder.street_address)

    city_state_zip = []
    if stakeholder.city:
        city_state_zip.append(stakeholder.city)
    if stakeholder.state:
        city_state_zip.append(stakeholder.state)
    if stakeholder.zip_code:
        city_state_zip.append(stakeholder.zip_code)

    if city_state_zip:
        parts.append(" ".join(city_state_zip))

    return "\n".join(parts) if parts else "No address"
```

## Debugging

### Check Geocoding Service Status

```python
def test_geocoding_services():
    """Test if geocoding services are working"""
    service = GeocodingService()

    # Test with known address
    test_address = {
        "street_address": "1600 Pennsylvania Avenue NW",
        "city": "Washington",
        "state": "DC",
        "zip_code": "20500"
    }

    # Test Tiger geocoder
    tiger_result = service._geocode_with_tiger(test_address)
    print(f"Tiger geocoder: {'Working' if tiger_result else 'Failed'}")

    # Test Nominatim
    nominatim_result = service._geocode_with_nominatim(test_address)
    print(f"Nominatim: {'Working' if nominatim_result else 'Failed'}")
```

### Validate District Data

```python
def check_district_data():
    """Verify district data is properly imported"""
    from coalition.regions.models import Region

    # Check each district type
    for district_type, name in Region.REGION_TYPE_CHOICES:
        count = Region.objects.filter(type=district_type).count()
        print(f"{name}: {count} regions")

    # Check for regions without geometry
    no_geom = Region.objects.filter(geom__isnull=True).count()
    if no_geom:
        print(f"Warning: {no_geom} regions without geometry")
```

### Find Orphaned Stakeholders

```python
def find_geocoding_issues():
    """Find stakeholders with geocoding issues"""

    # Stakeholders with location but no districts
    missing_districts = Stakeholder.objects.filter(
        location__isnull=False,
        congressional_district__isnull=True
    )
    print(f"Stakeholders with location but no districts: {missing_districts.count()}")

    # Stakeholders with inconsistent state/district
    inconsistent = Stakeholder.objects.exclude(
        congressional_district__isnull=True
    ).exclude(
        congressional_district__name__icontains=F('state')
    )
    print(f"Stakeholders with inconsistent state/district: {inconsistent.count()}")
```

## Environment Variables

```bash
# Geocoding settings
GEOCODING_RATE_LIMIT=10  # Requests per minute
GEOCODING_TIMEOUT=30     # Seconds
GEOCODING_RETRY_DELAY=2  # Seconds between retries

# Database settings for spatial queries
DATABASE_SPATIAL_ENGINE=django.contrib.gis.db.backends.postgis
SPATIAL_INDEX_BUFFER=1000  # Meters for spatial index optimization
```

## Common Errors and Solutions

### Import Error: No module named 'geopy'

```bash
# Install dependencies
pip install geopy
# or
poetry add geopy
```

### Django Migration Error: PostGIS not installed

```bash
# Install PostGIS (Ubuntu/Debian)
sudo apt-get install postgis postgresql-contrib

# Install PostGIS (macOS with Homebrew)
brew install postgis
```

### Geocoding Service Timeout

```python
# Increase timeout in service initialization
class GeocodingService:
    def __init__(self):
        self.nominatim = Nominatim(
            user_agent="coalition-builder",
            timeout=30  # Increase from default 10 seconds
        )
```

### Spatial Query Performance Issues

```sql
-- Check if spatial indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'stakeholders_stakeholder'
AND indexname LIKE '%location%';

-- Analyze spatial query performance
EXPLAIN ANALYZE SELECT * FROM stakeholders_stakeholder
WHERE ST_DWithin(location, ST_Point(-76.6122, 39.2904), 10000);
```

This quick reference provides the essential code snippets and patterns for working with the geocoding system efficiently.
