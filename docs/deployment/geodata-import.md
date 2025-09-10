# Geographic Data Import

## Overview

The Coalition Builder uses TIGER/Line shapefiles from the U.S. Census Bureau for geographic boundaries. These imports are run as ECS Fargate tasks to handle the CPU and memory-intensive GDAL operations.

## Architecture

```
GitHub Actions
    ↓
ECS Fargate Task (4GB RAM, 2 vCPU)
    ├── GDAL/GEOS/PROJ libraries
    ├── Django with GeoDjango
    └── PostGIS database
```

## Import Process

### Automatic Import via GitHub Actions

The easiest way to import geographic data is through the GitHub Actions workflow:

1. Go to Actions → Geographic Data Import
2. Click "Run workflow"
3. Select options:
   - **Import type**: states, counties, places, or all
   - **States**: Comma-separated state codes or "all"
   - **Year**: TIGER data year (default: 2023)
   - **Environment**: dev, staging, or production

### Manual Import via ECS

```bash
# Run the ECS task directly
aws ecs run-task \
  --cluster coalition-builder-geodata-import \
  --task-definition coalition-builder-geodata-import \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "geodata-import",
      "command": ["python", "manage.py", "import_tiger_data", "--all"]
    }]
  }'
```

### Local Import (Development)

```bash
cd backend
poetry run python manage.py import_tiger_data --help

# Import all data
poetry run python manage.py import_tiger_data --all

# Import specific states
poetry run python manage.py import_tiger_data --type=state --states=CA,NY,TX

# Import with specific year
poetry run python manage.py import_tiger_data --type=county --year=2023
```

## Data Types

### States

- Boundary data for all 50 states plus territories
- Fields: NAME, STATEFP, STATENS, GEOID, STUSPS, etc.
- Size: ~100MB compressed

### Counties

- County and county-equivalent boundaries
- Fields: NAME, STATEFP, COUNTYFP, COUNTYNS, GEOID, etc.
- Size: ~200MB compressed

### Places

- Incorporated places and census designated places
- Fields: NAME, STATEFP, PLACEFP, PLACENS, GEOID, etc.
- Size: ~150MB compressed

### Congressional Districts

- Current congressional district boundaries
- Fields: STATEFP, CD116FP, GEOID, NAMELSAD, etc.
- Size: ~50MB compressed

## Import Command Options

```bash
python manage.py import_tiger_data [options]

Options:
  --type TYPE           Type of data to import (state, county, place, district)
  --states STATES       Comma-separated state codes (e.g., CA,NY,TX)
  --year YEAR          TIGER data year (default: 2023)
  --all                Import all data types
  --force              Force re-import even if data exists
  --cleanup            Remove temporary files after import
  --verbose            Show detailed progress
```

## Performance Considerations

### Resource Requirements

- **CPU**: 2 vCPU minimum (for shapefile processing)
- **Memory**: 4GB minimum (for GDAL operations)
- **Disk**: 10GB temporary space
- **Time**: 10-30 minutes for full import

### Optimization Tips

1. Import only needed states rather than all
2. Use `--cleanup` to remove temporary files
3. Run imports during off-peak hours
4. Consider using larger instance for faster processing

## Database Impact

### Storage

- States: ~500MB in database
- Counties: ~1GB in database
- Places: ~750MB in database
- Total with indexes: ~3-4GB

### Indexes

The import process creates spatial indexes automatically:

```sql
CREATE INDEX idx_regions_geometry ON regions_region USING GIST (geometry);
CREATE INDEX idx_regions_state ON regions_region(state_code);
CREATE INDEX idx_regions_type ON regions_region(region_type);
```

## Monitoring Imports

### CloudWatch Logs

View import progress in CloudWatch:

```
Log Group: /ecs/geodata-import
Log Stream: geodata/{task-id}
```

### Database Queries

Check import status:

```sql
-- Count imported regions by type
SELECT region_type, COUNT(*)
FROM regions_region
GROUP BY region_type;

-- Check spatial data validity
SELECT COUNT(*)
FROM regions_region
WHERE NOT ST_IsValid(geometry);
```

## Troubleshooting

### Import Fails

1. **Out of Memory**

   - Increase ECS task memory
   - Import smaller batches of states

2. **Network Timeout**

   - Census FTP may be slow
   - Retry or download files locally first

3. **Database Connection**
   - Check security groups
   - Verify database credentials
   - Ensure PostGIS extension is enabled

### Data Issues

1. **Missing Geometries**

   ```sql
   -- Find regions with invalid geometry
   SELECT name, state_code
   FROM regions_region
   WHERE geometry IS NULL;
   ```

2. **Duplicate Entries**

   ```sql
   -- Find duplicates
   SELECT geoid, COUNT(*)
   FROM regions_region
   GROUP BY geoid
   HAVING COUNT(*) > 1;
   ```

## Validation

After import, validate the data:

```python
# Django shell validation
from regions.models import Region

# Check counts
print(f"States: {Region.objects.filter(region_type='state').count()}")
print(f"Counties: {Region.objects.filter(region_type='county').count()}")
print(f"Places: {Region.objects.filter(region_type='place').count()}")

# Test spatial queries
from django.contrib.gis.geos import Point
point = Point(-122.4194, 37.7749)  # San Francisco
regions = Region.objects.filter(geometry__contains=point)
for region in regions:
    print(f"{region.region_type}: {region.name}")
```

## Scheduling Imports

For annual updates, schedule imports:

```yaml
# .github/workflows/scheduled-import.yml
on:
  schedule:
    - cron: "0 0 1 1 *" # January 1st each year
```

## Cost

- **ECS Fargate**: ~$0.50 per import
- **Data Transfer**: ~$0.10 per import
- **Total**: ~$0.60 per full import

Monthly cost if run weekly: ~$2.40
