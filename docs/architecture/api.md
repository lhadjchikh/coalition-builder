# API Design Patterns

This document outlines the API design patterns and architectural decisions used in Coalition Builder's backend API.

## API Architecture

### REST API Design

Coalition Builder follows RESTful API design principles with Django Ninja for type-safe, FastAPI-inspired endpoints.

**Base URL Structure:**

```
/api/
├── homepage/              # Homepage content management
├── campaigns/             # Policy campaigns
├── stakeholders/          # Stakeholder management
├── endorsements/          # Campaign endorsements
├── legislators/           # Legislator information
└── health/               # API health checks
```

### Design Principles

1. **Resource-Based URLs**: URLs represent resources, not actions
2. **HTTP Methods**: Use appropriate HTTP verbs (GET, POST, PUT, DELETE)
3. **Consistent Response Format**: Standardized JSON responses across all endpoints
4. **Type Safety**: Django Ninja provides automatic validation and serialization
5. **Error Handling**: Consistent error responses with appropriate HTTP status codes

## Endpoint Patterns

### Homepage Content API

**GET /api/homepage/**

- Returns active homepage configuration with content blocks
- Includes nested content blocks sorted by order
- Filters to only visible content blocks

**Response Structure:**

```json
{
  "id": 1,
  "organization_name": "Coalition Name",
  "tagline": "Mission statement",
  "hero_title": "Page title",
  "content_blocks": [
    {
      "id": 1,
      "title": "Block title",
      "block_type": "text",
      "content": "<p>HTML content</p>",
      "order": 1,
      "is_visible": true
    }
  ],
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Campaign Management API

**GET /api/campaigns/**

- Returns list of all active campaigns
- Lightweight response for listing views

**GET /api/campaigns/{slug}/**

- Returns detailed campaign information
- Includes related data like endorsements

**Response Patterns:**

```json
// List response
[
  {
    "id": 1,
    "title": "Campaign Title",
    "slug": "campaign-slug",
    "summary": "Brief description",
    "active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]

// Detail response
{
  "id": 1,
  "title": "Campaign Title",
  "slug": "campaign-slug",
  "summary": "Brief description",
  "description": "Full HTML description",
  "active": true,
  "endorsements_count": 25,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Data Serialization

### Django Ninja Schemas

Type-safe schema definitions ensure consistent data validation:

```python
# api/schemas.py
from ninja import Schema
from datetime import datetime
from typing import List, Optional

class ContentBlockSchema(Schema):
    id: int
    title: Optional[str]
    block_type: str
    content: str
    image_url: Optional[str]
    image_alt_text: Optional[str]
    css_classes: Optional[str]
    background_color: Optional[str]
    order: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime

class HomepageSchema(Schema):
    id: int
    organization_name: str
    tagline: Optional[str]
    hero_title: Optional[str]
    hero_subtitle: Optional[str]
    hero_background_image: Optional[str]
    about_section_title: Optional[str]
    about_section_content: Optional[str]
    cta_title: Optional[str]
    cta_content: Optional[str]
    cta_button_text: Optional[str]
    cta_button_url: Optional[str]
    contact_email: str
    contact_phone: Optional[str]
    facebook_url: Optional[str]
    twitter_url: Optional[str]
    instagram_url: Optional[str]
    linkedin_url: Optional[str]
    campaigns_section_title: Optional[str]
    campaigns_section_subtitle: Optional[str]
    show_campaigns_section: bool
    content_blocks: List[ContentBlockSchema]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class CampaignListSchema(Schema):
    id: int
    title: str
    slug: str
    summary: str
    active: bool
    created_at: datetime

class CampaignDetailSchema(Schema):
    id: int
    title: str
    slug: str
    summary: str
    description: Optional[str]
    active: bool
    endorsements_count: int
    created_at: datetime
    updated_at: datetime
```

### Custom Serialization Logic

```python
# api/homepage.py
from ninja import Router
from django.shortcuts import get_object_or_404
from coalition.core.models import HomePage
from .schemas import HomepageSchema

router = Router()

@router.get("/", response=HomepageSchema)
def get_homepage(request):
    """Get active homepage with content blocks"""
    homepage = HomePage.get_active()
    if not homepage:
        return JsonResponse(
            {"detail": "No active homepage configuration found"},
            status=404
        )

    # Custom serialization to include only visible, ordered content blocks
    content_blocks = homepage.content_blocks.filter(
        is_visible=True
    ).order_by('order')

    return homepage
```

## Error Handling

### Consistent Error Responses

All API endpoints return errors in a standardized format:

```json
{
  "detail": "Human-readable error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "field_errors": {
    // Only for validation errors
    "field_name": ["Field-specific error message"]
  }
}
```

### HTTP Status Codes

- **200 OK**: Successful GET requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Validation errors or malformed requests
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### Error Handling Implementation

```python
# api/exceptions.py
from ninja import NinjaAPI
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(request, exc):
    """Custom exception handler for API errors"""
    if isinstance(exc, ValidationError):
        return JsonResponse(
            {
                "detail": "Validation failed",
                "error_code": "VALIDATION_ERROR",
                "field_errors": exc.message_dict
            },
            status=400
        )

    if isinstance(exc, Http404):
        return JsonResponse(
            {
                "detail": "Resource not found",
                "error_code": "NOT_FOUND"
            },
            status=404
        )

    # Log unexpected errors
    logger.error(f"Unexpected API error: {exc}", exc_info=True)

    return JsonResponse(
        {
            "detail": "An unexpected error occurred",
            "error_code": "INTERNAL_ERROR"
        },
        status=500
    )

# Register with Django Ninja
api = NinjaAPI(
    title="Coalition Builder API",
    version="1.0.0",
    description="API for Coalition Builder platform"
)
api.exception_handler(Exception)(custom_exception_handler)
```

## Performance Patterns

### Database Query Optimization

```python
# Optimized endpoint with select_related and prefetch_related
@router.get("/", response=List[CampaignWithEndorsementsSchema])
def list_campaigns_with_endorsements(request):
    """Optimized campaign list with endorsement counts"""
    campaigns = PolicyCampaign.objects.select_related(
        'category'
    ).prefetch_related(
        'endorsements__stakeholder'
    ).annotate(
        endorsements_count=Count('endorsements')
    ).filter(active=True)

    return campaigns
```

### Response Caching

```python
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from ninja.decorators import decorate_view

@router.get("/")
@decorate_view(cache_page(60 * 5))  # Cache for 5 minutes
def get_homepage(request):
    """Cached homepage endpoint"""
    cache_key = "active_homepage"
    homepage = cache.get(cache_key)

    if not homepage:
        homepage = HomePage.get_active()
        if homepage:
            cache.set(cache_key, homepage, 300)  # 5 minutes

    return homepage
```

## Pagination Patterns

### Cursor-Based Pagination

```python
from ninja import Schema
from typing import Optional

class PaginatedResponse(Schema):
    results: List[dict]
    next_cursor: Optional[str]
    has_next: bool
    count: int

@router.get("/campaigns/", response=PaginatedResponse)
def list_campaigns_paginated(
    request,
    cursor: Optional[str] = None,
    limit: int = 20
):
    """Paginated campaign list"""
    queryset = PolicyCampaign.objects.filter(active=True)

    if cursor:
        # Decode cursor and filter
        decoded_cursor = decode_cursor(cursor)
        queryset = queryset.filter(id__lt=decoded_cursor)

    campaigns = list(queryset.order_by('-id')[:limit + 1])
    has_next = len(campaigns) > limit

    if has_next:
        campaigns = campaigns[:-1]
        next_cursor = encode_cursor(campaigns[-1].id)
    else:
        next_cursor = None

    return {
        "results": campaigns,
        "next_cursor": next_cursor,
        "has_next": has_next,
        "count": queryset.count()
    }
```

## API Versioning

### URL-Based Versioning (Future)

```python
# Future API versioning structure
/api/v1/campaigns/    # Version 1
/api/v2/campaigns/    # Version 2 with breaking changes

# Current implementation (no version in URL assumes v1)
/api/campaigns/       # Implicit v1
```

### Backward Compatibility

```python
# Maintaining backward compatibility
class CampaignSchema_v1(Schema):
    id: int
    title: str
    summary: str
    # Original fields only

class CampaignSchema_v2(CampaignSchema_v1):
    description: Optional[str]
    endorsements_count: int
    # New fields added

@router.get("/v1/campaigns/", response=List[CampaignSchema_v1])
def list_campaigns_v1(request):
    return PolicyCampaign.objects.all()

@router.get("/v2/campaigns/", response=List[CampaignSchema_v2])
def list_campaigns_v2(request):
    return PolicyCampaign.objects.annotate(
        endorsements_count=Count('endorsements')
    )
```

## Security Patterns

### Input Validation

```python
from ninja import Schema
from pydantic import validator

class CreateCampaignSchema(Schema):
    title: str
    summary: str
    description: Optional[str]

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('summary')
    def summary_length(cls, v):
        if len(v) > 500:
            raise ValueError('Summary must be 500 characters or less')
        return v
```

### CORS Configuration

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React development
    "http://localhost:3001",  # SSR development
    "https://yourdomain.com", # Production frontend
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## API Documentation

### Automatic Documentation

Django Ninja automatically generates OpenAPI documentation:

```python
# Access interactive docs at:
# /api/docs/     - Swagger UI
# /api/redoc/    - ReDoc
# /api/openapi.json - OpenAPI schema

api = NinjaAPI(
    title="Coalition Builder API",
    version="1.0.0",
    description="Comprehensive API for advocacy campaign management",
    docs_url="/docs/",
    openapi_url="/openapi.json"
)
```

### Custom Documentation

```python
@router.get("/campaigns/",
    summary="List all active campaigns",
    description="Returns a list of all active policy campaigns with basic information",
    response=List[CampaignListSchema],
    tags=["Campaigns"])
def list_campaigns(request):
    """
    Retrieve all active policy campaigns.

    Returns campaigns sorted by creation date (newest first).
    Only includes campaigns marked as active.
    """
    return PolicyCampaign.objects.filter(active=True).order_by('-created_at')
```

This API design provides a solid foundation for frontend applications while maintaining flexibility for future enhancements and ensuring type safety throughout the application.
