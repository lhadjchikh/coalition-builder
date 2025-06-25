# Address Validation and Geocoding

_Add this section to the main README.md file_

---

## 🗺️ Geographic Features

Coalition Builder includes comprehensive address validation and geocoding capabilities that automatically determine legislative districts for stakeholders based on their addresses.

### ✨ Key Features

- **🏠 Address Validation**: Validates US addresses with proper formatting and normalization
- **📍 Automatic Geocoding**: Converts addresses to coordinates using PostGIS Tiger and Nominatim
- **🏛️ Legislative Districts**: Automatically assigns stakeholders to congressional and state legislative districts
- **🔍 Spatial Queries**: Find stakeholders by location, district, or proximity
- **📊 Geographic Analytics**: Analyze stakeholder distribution across districts and regions

### 🚀 Quick Start

#### Create a Stakeholder with Address

```python
# Via API
POST /api/stakeholders/
{
  "name": "John Doe",
  "email": "john@example.com",
  "street_address": "123 Main St",
  "city": "Baltimore",
  "state": "MD",
  "zip_code": "21201",
  "type": "individual"
}

# Response includes automatic district assignment
{
  "id": 123,
  "name": "John Doe",
  "latitude": 39.2904,
  "longitude": -76.6122,
  "congressional_district": {
    "name": "Maryland District 3",
    "abbrev": "MD-03"
  },
  "state_senate_district": {
    "name": "Maryland Senate District 21",
    "abbrev": "MD-SD-21"
  }
}
```

#### Geographic Queries

```bash
# Find stakeholders near a location
GET /api/stakeholders/?near_lat=39.2904&near_lng=-76.6122&distance_km=10

# Filter by congressional district
GET /api/stakeholders/?congressional_district=45

# Filter by state
GET /api/stakeholders/?state=MD
```

#### Management Commands

```bash
# Import legislative district boundaries
python manage.py import_tiger_data --type congressional --year 2024
python manage.py import_tiger_data --type state_senate --state 24

# Geocode existing stakeholders
python manage.py geocode_stakeholders --state MD --limit 100
```

### 🛠️ Setup Requirements

#### Database Configuration

**PostGIS (Recommended for Production):**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'coalition_builder',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
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

#### Install Dependencies

```bash
# Python dependencies
pip install geopy

# PostGIS (Ubuntu/Debian)
sudo apt-get install postgis postgresql-contrib

# PostGIS (macOS with Homebrew)
brew install postgis
```

#### Run Migrations

```bash
python manage.py migrate
```

### 📚 Documentation

- **[Feature Guide](address-validation.md)** - Comprehensive feature documentation
- **[API Reference](../api/stakeholders-enhanced.md)** - Enhanced API endpoints
- **[Architecture Guide](../development/geocoding-architecture.md)** - Technical implementation details
- **[Quick Reference](../reference/geocoding-quick-reference.md)** - Code examples and common patterns

### 🔧 Advanced Usage

#### Spatial Analysis

```python
from coalition.stakeholders.spatial import SpatialQueryUtils

utils = SpatialQueryUtils()

# Find stakeholders within 5km of a point
nearby = utils.find_stakeholders_near_point(
    latitude=39.2904,
    longitude=-76.6122,
    distance_km=5
)

# Get stakeholder counts by district
stats = utils.get_district_statistics("congressional_district")
```

#### Custom Validation

```python
from coalition.stakeholders.validators import AddressValidator

# Validate address components
try:
    validated = AddressValidator.validate_complete_address(
        street_address="123 Main St",
        city="Baltimore",
        state="MD",
        zip_code="21201"
    )
except ValidationError as e:
    print(f"Invalid address: {e}")
```

#### Batch Processing

```bash
# Process large datasets efficiently
python manage.py geocode_stakeholders --limit 1000 --delay 1
python manage.py geocode_stakeholders --retry-failed
```

### 🌐 Data Sources

- **Legislative Districts**: US Census Bureau TIGER/Line shapefiles
- **Geocoding**: PostGIS Tiger geocoder (primary) + Nominatim (fallback)
- **Boundaries**: 119th Congress congressional districts, current state legislative districts
- **Coverage**: All 50 US states, DC, and territories

### 🔒 Privacy & Security

- **Data Privacy**: Only normalized addresses sent to external geocoding services
- **Rate Limiting**: Built-in delays and limits to respect service usage policies
- **No PII Exposure**: Stakeholder names and emails never sent to external services
- **Secure Storage**: All geographic data stored securely in your database

### 📈 Performance

- **Spatial Indexing**: Automatic spatial indexes for fast geographic queries
- **Batch Processing**: Efficient bulk geocoding with rate limiting
- **Query Optimization**: Optimized database queries with proper relationships
- **Caching Ready**: Compatible with Django caching for frequently accessed data

### 🤝 Contributing

The geocoding system is designed to be extensible:

- **Custom Validators**: Add validation for international addresses
- **Additional Geocoders**: Integrate additional geocoding services
- **New District Types**: Support for municipal or special districts
- **Enhanced Analytics**: Add more spatial analysis capabilities

See the [Architecture Guide](../development/geocoding-architecture.md) for implementation details.

---

_This feature enhances Coalition Builder's ability to understand stakeholder geographic distribution and enables powerful location-based analysis and outreach capabilities._
