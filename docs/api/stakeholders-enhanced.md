# Enhanced Stakeholder API

The stakeholder API has been enhanced with address validation, geocoding, and legislative district assignment capabilities.

## Endpoints

### Create Stakeholder

**POST** `/api/stakeholders/`

Creates a new stakeholder with automatic address validation and geocoding.

#### Request Body

```json
{
  "name": "John Doe",
  "organization": "Acme Corp",
  "email": "john.doe@example.com",
  "street_address": "123 Main Street",
  "city": "Baltimore",
  "state": "MD",
  "zip_code": "21201",
  "county": "Baltimore",
  "type": "individual"
}
```

#### Field Validation

**Required Fields:**

- `name` (string): Stakeholder name
- `email` (string): Valid email address
- `type` (string): One of "individual", "organization", "government", "other"

**Address Fields (Optional but recommended):**

- `street_address` (string, 5-255 chars): Street address
- `city` (string, 2-100 chars): City name (auto-capitalized)
- `state` (string, 2 chars): US state code (auto-uppercased, validated)
- `zip_code` (string): 5-digit or ZIP+4 format (12345 or 12345-6789)
- `county` (string, max 100 chars): County name

#### Response

**Success (201 Created):**

```json
{
  "id": 123,
  "name": "John Doe",
  "organization": "Acme Corp",
  "email": "john.doe@example.com",
  "street_address": "123 Main Street",
  "city": "Baltimore",
  "state": "MD",
  "zip_code": "21201",
  "county": "Baltimore",
  "type": "individual",
  "latitude": 39.2904,
  "longitude": -76.6122,
  "congressional_district": {
    "id": 45,
    "name": "Maryland District 3",
    "abbrev": "MD-03",
    "type": "congressional_district"
  },
  "state_senate_district": {
    "id": 78,
    "name": "Maryland Senate District 21",
    "abbrev": "MD-SD-21",
    "type": "state_senate_district"
  },
  "state_house_district": {
    "id": 134,
    "name": "Maryland House District 21A",
    "abbrev": "MD-HD-21A",
    "type": "state_house_district"
  },
  "geocoded_at": "2025-06-24T15:30:45Z",
  "geocoding_failed": false,
  "created_at": "2025-06-24T15:30:45Z",
  "updated_at": "2025-06-24T15:30:45Z"
}
```

**Validation Error (400 Bad Request):**

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["state"],
      "msg": "Invalid state code: XX",
      "input": "XX"
    }
  ]
}
```

### Update Stakeholder

**PUT** `/api/stakeholders/{id}/`

Updates a stakeholder. If address fields are modified, automatic re-geocoding will occur.

#### Request Body

Same format as create, all fields optional.

#### Response

Same format as create response.

### Get Stakeholder

**GET** `/api/stakeholders/{id}/`

Retrieves a single stakeholder with all address and district information.

#### Response

Same format as create response.

### List Stakeholders

**GET** `/api/stakeholders/`

Lists stakeholders with optional filtering by geographic criteria.

#### Query Parameters

**Standard Filters:**

- `type`: Filter by stakeholder type
- `state`: Filter by state abbreviation
- `search`: Search name, organization, email

**Geographic Filters:**

- `congressional_district`: Filter by congressional district ID
- `state_senate_district`: Filter by state senate district ID
- `state_house_district`: Filter by state house district ID
- `has_location`: Filter stakeholders with/without coordinates (true/false)
- `geocoding_failed`: Filter by geocoding status (true/false)

**Distance-Based Filtering:**

- `near_lat`: Latitude for proximity search
- `near_lng`: Longitude for proximity search
- `distance_km`: Distance in kilometers (requires near_lat/near_lng)

#### Examples

```bash
# Get stakeholders from Maryland
GET /api/stakeholders/?state=MD

# Get stakeholders in a specific congressional district
GET /api/stakeholders/?congressional_district=45

# Get stakeholders within 10km of a point
GET /api/stakeholders/?near_lat=39.2904&near_lng=-76.6122&distance_km=10

# Get stakeholders with failed geocoding
GET /api/stakeholders/?geocoding_failed=true

# Get stakeholders without location data
GET /api/stakeholders/?has_location=false
```

#### Response

```json
{
  "count": 150,
  "next": "http://example.com/api/stakeholders/?page=2",
  "previous": null,
  "results": [
    {
      // ... stakeholder objects (same format as create response)
    }
  ]
}
```

## Address Validation

### Automatic Validation

Address validation occurs automatically on create/update:

1. **State Code Validation**: Must be valid US state/territory abbreviation
2. **ZIP Code Validation**: Must be 5-digit or ZIP+4 format
3. **Street Address Validation**: Must be 5-255 characters
4. **City Validation**: Must be 2-100 characters, letters/spaces/hyphens/apostrophes only

### Manual Validation Endpoint

**POST** `/api/stakeholders/validate-address/`

Validates an address without creating a stakeholder.

#### Request Body

```json
{
  "street_address": "123 Main St",
  "city": "Baltimore",
  "state": "MD",
  "zip_code": "21201"
}
```

#### Response

**Valid Address (200 OK):**

```json
{
  "valid": true,
  "normalized": {
    "street_address": "123 Main St",
    "city": "Baltimore",
    "state": "MD",
    "zip_code": "21201"
  },
  "formatted": "123 Main St\nBaltimore, MD 21201"
}
```

**Invalid Address (400 Bad Request):**

```json
{
  "valid": false,
  "errors": [
    "Invalid state code: XX",
    "ZIP code must be in format 12345 or 12345-6789"
  ]
}
```

## Geocoding

### Automatic Geocoding

Geocoding happens automatically when:

- A stakeholder is created with a complete address
- A stakeholder's address is updated
- Address validation passes

### Geocoding Status

Check geocoding status via the API response fields:

- `latitude`/`longitude`: Coordinates (null if not geocoded)
- `geocoded_at`: Timestamp of last successful geocoding (null if never)
- `geocoding_failed`: Boolean indicating if last attempt failed

### Manual Geocoding Endpoint

**POST** `/api/stakeholders/{id}/geocode/`

Manually trigger geocoding for a stakeholder.

#### Response

**Success (200 OK):**

```json
{
  "success": true,
  "latitude": 39.2904,
  "longitude": -76.6122,
  "districts_assigned": {
    "congressional_district": "MD-03",
    "state_legislative_upper": "MD-SD-21",
    "state_legislative_lower": "MD-HD-21A"
  }
}
```

**Failed (400 Bad Request):**

```json
{
  "success": false,
  "error": "Incomplete address - missing required fields"
}
```

## Legislative Districts

### District Information

District assignments are included in stakeholder responses:

```json
{
  "congressional_district": {
    "id": 45,
    "name": "Maryland District 3",
    "abbrev": "MD-03",
    "type": "congressional_district",
    "geoid": "2403"
  },
  "state_senate_district": {
    "id": 78,
    "name": "Maryland Senate District 21",
    "abbrev": "MD-SD-21",
    "type": "state_senate_district",
    "geoid": "24021"
  },
  "state_house_district": {
    "id": 134,
    "name": "Maryland House District 21A",
    "abbrev": "MD-HD-21A",
    "type": "state_house_district",
    "geoid": "2421A"
  }
}
```

### District Lookup Endpoint

**GET** `/api/regions/lookup/?lat={lat}&lng={lng}`

Look up districts for a specific coordinate.

#### Parameters

- `lat`: Latitude (required)
- `lng`: Longitude (required)

#### Response

```json
{
  "latitude": 39.2904,
  "longitude": -76.6122,
  "districts": {
    "congressional_district": {
      "id": 45,
      "name": "Maryland District 3",
      "abbrev": "MD-03"
    },
    "state_legislative_upper": {
      "id": 78,
      "name": "Maryland Senate District 21",
      "abbrev": "MD-SD-21"
    },
    "state_legislative_lower": {
      "id": 134,
      "name": "Maryland House District 21A",
      "abbrev": "MD-HD-21A"
    },
    "state": {
      "id": 24,
      "name": "Maryland",
      "abbrev": "MD"
    },
    "county": {
      "id": 510,
      "name": "Baltimore County",
      "abbrev": "MD-Baltimore"
    }
  }
}
```

## CSV/JSON Export

### Enhanced Export Formats

The export endpoints now include address and district information:

**GET** `/api/stakeholders/export/csv/`
**GET** `/api/stakeholders/export/json/`

#### Query Parameters

Same filtering options as list endpoint.

#### CSV Columns

```csv
name,organization,email,type,street_address,city,state,zip_code,county,latitude,longitude,congressional_district,state_senate_district,state_house_district,geocoded_at,created_at
John Doe,Acme Corp,john@example.com,individual,123 Main St,Baltimore,MD,21201,Baltimore,39.2904,-76.6122,MD-03,MD-SD-21,MD-HD-21A,2025-06-24T15:30:45Z,2025-06-24T15:30:45Z
```

#### JSON Format

```json
[
  {
    "name": "John Doe",
    "organization": "Acme Corp",
    "email": "john@example.com",
    "type": "individual",
    "street_address": "123 Main St",
    "city": "Baltimore",
    "state": "MD",
    "zip_code": "21201",
    "county": "Baltimore",
    "latitude": 39.2904,
    "longitude": -76.6122,
    "congressional_district": "MD-03",
    "state_senate_district": "MD-SD-21",
    "state_house_district": "MD-HD-21A",
    "geocoded_at": "2025-06-24T15:30:45Z",
    "created_at": "2025-06-24T15:30:45Z"
  }
]
```

## Error Handling

### Common Error Responses

**Validation Errors (400 Bad Request):**

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["zip_code"],
      "msg": "ZIP code must be in format 12345 or 12345-6789",
      "input": "1234"
    }
  ]
}
```

**Geocoding Service Errors (503 Service Unavailable):**

```json
{
  "detail": "Geocoding service temporarily unavailable"
}
```

**Not Found (404 Not Found):**

```json
{
  "detail": "Stakeholder not found"
}
```

### Error Codes

- `400`: Validation errors, malformed requests
- `404`: Stakeholder not found
- `429`: Rate limit exceeded
- `503`: Geocoding service unavailable

## Rate Limiting

### Geocoding Limits

- Manual geocoding requests: 10 per minute per IP
- Automatic geocoding: No additional limits
- Bulk operations: Use management commands for large datasets

### Best Practices

1. **Batch Address Updates**: Update multiple fields in a single request
2. **Check Existing Data**: Don't re-geocode if coordinates already exist
3. **Handle Failures Gracefully**: Check `geocoding_failed` flag
4. **Use Filters**: Narrow results with geographic filters instead of client-side filtering

## Examples

### JavaScript/Fetch

```javascript
// Create stakeholder with address
const stakeholder = await fetch("/api/stakeholders/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": getCsrfToken(),
  },
  body: JSON.stringify({
    name: "Jane Smith",
    email: "jane@example.com",
    street_address: "456 Oak Ave",
    city: "Austin",
    state: "TX",
    zip_code: "78701",
    type: "individual",
  }),
}).then((r) => r.json());

console.log(
  `Assigned to district: ${stakeholder.congressional_district.abbrev}`
);

// Find nearby stakeholders
const nearby = await fetch(
  `/api/stakeholders/?near_lat=30.2672&near_lng=-97.7431&distance_km=5`
).then((r) => r.json());
```

### Python/Requests

```python
import requests

# Create stakeholder
response = requests.post('http://localhost:8000/api/stakeholders/', json={
    'name': 'Bob Johnson',
    'email': 'bob@example.com',
    'street_address': '789 Pine St',
    'city': 'Denver',
    'state': 'CO',
    'zip_code': '80202',
    'type': 'individual'
})

stakeholder = response.json()
print(f"District: {stakeholder['congressional_district']['abbrev']}")

# Validate address before creating
validation = requests.post('http://localhost:8000/api/stakeholders/validate-address/', json={
    'street_address': '123 Main St',
    'city': 'Invalid City!!!',
    'state': 'XX',
    'zip_code': '1234'
})

if validation.status_code == 400:
    print("Address validation failed:", validation.json()['errors'])
```
