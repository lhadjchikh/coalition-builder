# Address Validation and Geocoding

The Coalition Builder platform includes comprehensive address validation and geocoding functionality that automatically determines legislative districts for stakeholders based on their addresses.

## Overview

This feature provides:

- **Address Validation**: Validates US addresses including street address, city, state, and ZIP code
- **Geocoding**: Converts addresses to geographic coordinates using multiple geocoding services
- **District Assignment**: Automatically assigns stakeholders to their congressional districts and state legislative districts
- **Spatial Queries**: Enables geographic analysis and district-based filtering of stakeholders

## Components

### Address Validator {#address-validator}

The `AddressValidator` utility class provides validation for US addresses:

```python
from coalition.stakeholders.validators import AddressValidator

# Validate individual components
state = AddressValidator.validate_state("MD")  # Returns "MD"
zip_code = AddressValidator.validate_zip_code("21201")  # Returns "21201"

# Validate complete address
address_data = AddressValidator.validate_complete_address(
    street_address="123 Main St",
    city="Baltimore",
    state="MD",
    zip_code="21201"
)
```

**Supported Validations:**

- **States**: All 50 US states plus DC, territories (case-insensitive, normalized to uppercase)
- **ZIP Codes**: 5-digit format (12345) and ZIP+4 format (12345-6789)
- **Street Addresses**: Length validation (5-255 characters)
- **Cities**: Character validation, proper case formatting

### Geocoding Service {#geocoding-service}

The `GeocodingService` class handles address geocoding and district assignment:

```python
from coalition.stakeholders.services import GeocodingService

service = GeocodingService()

# Geocode a single address
point = service.geocode_address(
    street_address="100 Congress Ave",
    city="Austin",
    state="TX",
    zip_code="78701"
)

# Geocode stakeholder and assign districts
success = service.geocode_and_assign_districts(stakeholder)
```

**Geocoding Strategy:**

1. **Primary**: PostGIS Tiger geocoder (high precision for US addresses)
2. **Fallback**: Nominatim/OpenStreetMap geocoder
3. **Automatic**: District assignment using spatial queries

### Enhanced Stakeholder Model

The `Stakeholder` model has been extended with address and location fields:

**New Fields:**

- `street_address`: Street address (CharField, max 255 chars, required)
- `city`: City name (CharField, max 100 chars, required)
- `state`: US state abbreviation (CharField, max 2 chars, required)
- `zip_code`: ZIP code (CharField, max 10 chars, required)
- `county`: County name (CharField, max 100 chars, optional)
- `location`: Geographic coordinates (PointField, SRID 4326, required)
- `congressional_district`: Foreign key to congressional district Region
- `state_senate_district`: Foreign key to state senate district Region
- `state_house_district`: Foreign key to state house district Region

**Helper Properties:**

```python
stakeholder = Stakeholder.objects.get(id=1)

# Check if address is complete
if stakeholder.has_complete_address:
    print(f"Address: {stakeholder.full_address}")

# Get coordinates
if stakeholder.location:
    print(f"Coordinates: {stakeholder.latitude}, {stakeholder.longitude}")
```

### Region Model Enhancements

The `Region` model supports the following district types:

- `state`: US States
- `county`: Counties
- `congressional_district`: Congressional Districts
- `state_senate_district`: State Senate Districts
- `state_house_district`: State House Districts

**New Fields:**

- `abbrev`: Region abbreviation (e.g., "MD-03", "TX-21", "CA-12")

## Usage

### API Integration

The address validation is automatically integrated into the stakeholder creation API:

```python
# POST /api/stakeholders/
{
    "name": "John Doe",
    "email": "john@example.com",
    "street_address": "123 Main St",
    "city": "Baltimore",
    "state": "MD",
    "zip_code": "21201",
    "type": "individual"
}
```

Address validation occurs automatically, and geocoding is performed in the background.

### Management Commands

#### Geocode Existing Stakeholders

```bash
# Geocode all stakeholders with complete addresses
python manage.py geocode_stakeholders

# Geocode only stakeholders from Maryland
python manage.py geocode_stakeholders --state MD

# Retry failed geocoding attempts
python manage.py geocode_stakeholders --retry-failed

# Limit to 100 stakeholders
python manage.py geocode_stakeholders --limit 100

# Dry run to see what would be geocoded
python manage.py geocode_stakeholders --dry-run
```

#### Import Legislative District Data

```bash
# Import congressional districts
python manage.py import_tiger_data --type congressional --year 2024

# Import Maryland state legislative districts
python manage.py import_tiger_data --type state_senate --year 2024 --state 24
python manage.py import_tiger_data --type state_house --year 2024 --state 24

# Import from local file
python manage.py import_tiger_data --type congressional --file /path/to/shapefile.shp

# Clear existing data before importing
python manage.py import_tiger_data --type congressional --clear
```

### Spatial Queries

Use the spatial utilities for geographic analysis:

```python
from coalition.stakeholders.spatial import SpatialQueryUtils

utils = SpatialQueryUtils()

# Get stakeholders within a distance of a point
nearby = utils.find_stakeholders_near_point(
    latitude=39.2904,
    longitude=-76.6122,
    distance_km=10
)

# Get stakeholders by district
by_district = utils.get_stakeholders_by_district(
    district_type="congressional_district",
    state_filter="MD"
)

# Get district statistics
stats = utils.get_district_statistics("congressional_district")
```

## Data Sources

### TIGER/Line Shapefiles

Legislative district boundaries are imported from the US Census Bureau's TIGER/Line shapefiles:

- **Congressional Districts**: 119th Congress boundaries
- **State Legislative Districts**: Upper and lower chamber boundaries
- **Geographic Data**: Full resolution for accurate spatial queries
- **Cartographic Boundaries**: Simplified versions for map display

### Geocoding Services

**PostGIS Tiger Geocoder:**

- High precision for US addresses
- Built into PostGIS/SpatiaLite
- Primary geocoding method

**Nominatim (OpenStreetMap):**

- Worldwide coverage
- Fallback geocoding method
- Rate-limited for respectful usage

## Configuration

### Database Requirements

**PostGIS (Recommended):**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'coalition_builder',
        # ... other settings
    }
}
```

**SpatiaLite (Development):**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.spatialite',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Dependencies

The following packages are required:

- `geopy`: Nominatim geocoding client
- `django.contrib.gis`: GeoDjango spatial framework
- PostGIS or SpatiaLite database backend

## Error Handling

### Geocoding Failures

The system gracefully handles geocoding failures:

1. **Invalid Addresses**: Validation errors prevent geocoding attempts
2. **Service Failures**: Automatic fallback from Tiger to Nominatim
3. **Rate Limiting**: Built-in delays and retry logic
4. **Tracking**: Failed attempts are logged with `geocoding_failed=True`

### Data Quality

**Address Normalization:**

- State codes normalized to uppercase
- Email addresses normalized to lowercase
- ZIP codes validated for proper format

**Coordinate Validation:**

- SRID 4326 (WGS84) coordinate system
- Spatial indexing for query performance
- Point-in-polygon validation for district assignment

## Performance Considerations

### Indexing

The following database indexes are automatically created:

- Spatial index on `Stakeholder.location`
- Index on `Stakeholder.state`
- Index on `Region.type`
- Index on `Region.abbrev`

### Batch Processing

For large datasets:

- Use management commands with `--limit` parameter
- Process by state to reduce memory usage
- Enable `--delay` for rate limiting

### Caching

Consider caching for frequently accessed data:

- District boundaries (rarely change)
- Geocoded coordinates (permanent once successful)
- Regional statistics

## Monitoring

### Metrics

Track the following metrics:

- Geocoding success/failure rates
- Processing time per address
- District assignment accuracy
- API response times

### Logging

The system logs:

- Geocoding attempts and results
- District assignment changes
- Validation failures
- Service fallback events

## Security

### Data Privacy

- Addresses are stored securely in the database
- No external services receive stakeholder names or emails
- Only normalized addresses are sent to geocoding services

### Rate Limiting

- Built-in delays prevent service abuse
- Configurable rate limits for geocoding APIs
- Respectful usage of free services

## Troubleshooting

### Common Issues

**Geocoding Failures:**

```bash
# Check failed stakeholders
python manage.py shell
>>> from coalition.stakeholders.models import Stakeholder
>>> failed = Stakeholder.objects.filter(geocoding_failed=True)
>>> for s in failed[:5]:
...     print(f"{s.name}: {s.full_address}")
```

**Missing Districts:**

```bash
# Verify district data is imported
python manage.py shell
>>> from coalition.regions.models import Region
>>> Region.objects.filter(type='congressional_district').count()
```

**Performance Issues:**

- Ensure spatial indexes are created
- Use `select_related()` for district queries
- Consider database connection pooling

### Debug Mode

Enable detailed logging:

```python
LOGGING = {
    'loggers': {
        'coalition.stakeholders.services': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```
