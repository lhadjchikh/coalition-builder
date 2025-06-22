# Database Architecture

This document covers the database design, schema, and data management patterns used in Coalition Builder.

## Database Technology

### PostgreSQL with PostGIS

Coalition Builder uses **PostgreSQL 16** with the **PostGIS** extension as its primary database:

- **PostgreSQL 16**: Latest stable version with advanced features
- **PostGIS 3.4**: Spatial database extension for geographic data
- **Connection Pooling**: pgBouncer for production connection management
- **High Availability**: AWS RDS with Multi-AZ deployment in production

### Database Configuration

**Development Environment:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'coalition',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**Production Environment:**

```python
# Uses AWS Secrets Manager for credential management
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'coalition',
        'HOST': RDS_ENDPOINT,
        'PORT': '5432',
        'USER': 'coalition_app',  # Application user
        'PASSWORD': get_secret('rds-password'),  # From AWS Secrets Manager
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
```

## Data Model Architecture

### Core Models

```python
# Homepage Content Management
HomePage
├── organization_name (CharField)
├── tagline (CharField, optional)
├── hero_title (CharField, optional)
├── hero_subtitle (CharField, optional)
├── hero_background_image (URLField, optional)
├── about_section_title (CharField, optional)
├── about_section_content (TextField, optional)
├── cta_title (CharField, optional)
├── cta_content (TextField, optional)
├── cta_button_text (CharField, optional)
├── cta_button_url (URLField, optional)
├── contact_email (EmailField)
├── contact_phone (CharField, optional)
├── social_media_urls (JSONField)
├── campaigns_section_title (CharField, optional)
├── campaigns_section_subtitle (CharField, optional)
├── show_campaigns_section (BooleanField)
├── is_active (BooleanField)
├── created_at (DateTimeField, auto)
└── updated_at (DateTimeField, auto)

ContentBlock
├── homepage (ForeignKey to HomePage)
├── title (CharField, optional)
├── block_type (CharField: text, image, video, etc.)
├── content (TextField, rich text)
├── image_url (URLField, optional)
├── image_alt_text (CharField, optional)
├── css_classes (CharField, optional)
├── background_color (CharField, optional)
├── order (PositiveIntegerField)
├── is_visible (BooleanField)
├── created_at (DateTimeField, auto)
└── updated_at (DateTimeField, auto)

# Campaign Management
PolicyCampaign
├── title (CharField, unique)
├── slug (SlugField, unique, indexed)
├── summary (TextField)
├── description (TextField, optional)
├── endorsement_statement (TextField, optional)
├── allow_endorsements (BooleanField, default=True)
├── endorsement_form_instructions (TextField, optional)
├── active (BooleanField, default=True, indexed)
├── created_at (DateTimeField, auto, indexed)
└── updated_at (DateTimeField, auto)

# Stakeholder Management
Stakeholder
├── name (CharField)
├── organization (CharField)
├── role (CharField, optional)
├── email (EmailField, unique)
├── state (CharField)
├── county (CharField, optional)
├── type (CharField: farmer, waterman, business, nonprofit, individual, government, other)
├── created_at (DateTimeField, auto)
└── updated_at (DateTimeField, auto)

# Campaign Endorsements
Endorsement
├── stakeholder (ForeignKey to Stakeholder)
├── campaign (ForeignKey to PolicyCampaign)
├── statement (TextField, optional)
├── public_display (BooleanField, default=True)
├── created_at (DateTimeField, auto)
└── updated_at (DateTimeField, auto)
```

### Database Constraints

```sql
-- Unique constraints
ALTER TABLE core_homepage ADD CONSTRAINT unique_active_homepage
    EXCLUDE USING btree ((is_active) WITH =) WHERE (is_active = true);

ALTER TABLE campaigns_policycampaign ADD CONSTRAINT unique_slug
    UNIQUE (slug);

-- Composite unique constraints
ALTER TABLE endorsements_endorsement ADD CONSTRAINT unique_stakeholder_campaign
    UNIQUE (stakeholder_id, campaign_id);

-- Check constraints
ALTER TABLE core_contentblock ADD CONSTRAINT positive_order
    CHECK (order >= 0);

-- Email uniqueness
ALTER TABLE stakeholders_stakeholder ADD CONSTRAINT unique_email
    UNIQUE (email);

-- Stakeholder type validation
ALTER TABLE stakeholders_stakeholder ADD CONSTRAINT valid_stakeholder_type
    CHECK (type IN ('farmer', 'waterman', 'business', 'nonprofit', 'individual', 'government', 'other'));
```

## PostGIS Integration

### Spatial Data Features

Coalition Builder leverages PostGIS for geographic capabilities:

```python
# Geographic fields in models
class Stakeholder(models.Model):
    # ... other fields ...
    location = models.PointField(
        geography=True,
        srid=4326,  # WGS84 coordinate system
        null=True,
        blank=True,
        help_text="Geographic location of stakeholder"
    )

# Spatial queries
# Find stakeholders within 50 miles of a point
nearby_stakeholders = Stakeholder.objects.filter(
    location__distance_lte=(point, D(mi=50))
)

# Find stakeholders in a specific state/region
state_stakeholders = Stakeholder.objects.filter(
    location__within=state_boundary_polygon
)
```

### PostGIS Extensions

Required PostGIS extensions are automatically installed:

```sql
-- Installed during database initialization
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
```

## Data Management Patterns

### Single Active Homepage

Only one homepage configuration can be active at a time:

```python
class HomePageManager(models.Manager):
    def get_active(self):
        """Get the currently active homepage configuration"""
        try:
            return self.get(is_active=True)
        except HomePage.DoesNotExist:
            return None

class HomePage(models.Model):
    # ... fields ...

    def save(self, *args, **kwargs):
        """Ensure only one homepage is active"""
        if self.is_active:
            # Deactivate all other homepages
            HomePage.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)
```

### Content Block Ordering

Content blocks are ordered within each homepage:

```python
class ContentBlockQuerySet(models.QuerySet):
    def visible(self):
        """Return only visible content blocks"""
        return self.filter(is_visible=True)

    def ordered(self):
        """Return content blocks in display order"""
        return self.order_by('order')

class ContentBlock(models.Model):
    # ... fields ...

    class Meta:
        ordering = ['order']
        indexes = [
            models.Index(fields=['homepage', 'order']),
            models.Index(fields=['is_visible', 'order']),
        ]
```

### Soft Deletion Pattern

Some models use soft deletion instead of hard deletion:

```python
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Include deleted objects

    def delete(self, hard=False):
        if hard:
            super().delete()
        else:
            self.deleted_at = timezone.now()
            self.save()

    class Meta:
        abstract = True
```

## Database Performance

### Indexing Strategy

Key indexes for performance optimization:

```sql
-- Campaign indexes
CREATE INDEX idx_campaign_active ON campaigns_policycampaign (active);
CREATE INDEX idx_campaign_created ON campaigns_policycampaign (created_at DESC);
CREATE INDEX idx_campaign_slug ON campaigns_policycampaign (slug);  -- Already unique

-- Stakeholder indexes
CREATE INDEX idx_stakeholder_type ON stakeholders_stakeholder (stakeholder_type);
CREATE INDEX idx_stakeholder_public ON stakeholders_stakeholder (is_public);
CREATE INDEX idx_stakeholder_location ON stakeholders_stakeholder USING GIST (location);

-- Endorsement indexes
CREATE INDEX idx_endorsement_campaign ON endorsements_endorsement (campaign_id);
CREATE INDEX idx_endorsement_stakeholder ON endorsements_endorsement (stakeholder_id);
CREATE INDEX idx_endorsement_public ON endorsements_endorsement (is_public);
CREATE INDEX idx_endorsement_created ON endorsements_endorsement (created_at DESC);

-- Content block indexes
CREATE INDEX idx_contentblock_homepage_order ON core_contentblock (homepage_id, order);
CREATE INDEX idx_contentblock_visible ON core_contentblock (is_visible, order);
```

### Query Optimization

Common query patterns with optimizations:

```python
# Optimized homepage query with content blocks
homepage = HomePage.objects.select_related().prefetch_related(
    Prefetch(
        'content_blocks',
        queryset=ContentBlock.objects.filter(is_visible=True).order_by('order')
    )
).get(is_active=True)

# Optimized campaign query with endorsement counts
campaigns = PolicyCampaign.objects.annotate(
    endorsement_count=Count('endorsements', filter=Q(endorsements__is_public=True))
).filter(active=True).order_by('-created_at')

# Optimized stakeholder query with geographic filtering
stakeholders = Stakeholder.objects.select_related().filter(
    is_public=True,
    location__distance_lte=(center_point, D(mi=radius))
).order_by('name')
```

## Data Security

### Access Control

Database access is controlled through multiple layers:

```python
# Application-level user with restricted permissions
CREATE USER coalition_app WITH PASSWORD 'secure_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE coalition TO coalition_app;
GRANT USAGE ON SCHEMA public TO coalition_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coalition_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO coalition_app;

-- Master user for administrative tasks only
CREATE USER coalition_master WITH PASSWORD 'master_password';
GRANT ALL PRIVILEGES ON DATABASE coalition TO coalition_master;
```

### Data Encryption

Production database security features:

- **Encryption at Rest**: AWS RDS encryption using AWS KMS
- **Encryption in Transit**: SSL/TLS connections required
- **Password Management**: AWS Secrets Manager integration
- **Network Security**: VPC private subnets with security groups

```python
# Production database connection with encryption
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'OPTIONS': {
            'sslmode': 'require',
            'sslcert': '/path/to/client-cert.pem',
            'sslkey': '/path/to/client-key.pem',
            'sslrootcert': '/path/to/ca-cert.pem',
        },
    }
}
```
