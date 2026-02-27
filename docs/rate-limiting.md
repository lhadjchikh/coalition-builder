# Rate Limiting

Coalition Builder implements database-backed rate limiting to prevent abuse and ensure fair usage of the platform. This approach provides perfect development/production parity while eliminating external dependencies like Redis or DynamoDB.

## Overview

The rate limiting system uses Django's database cache backend with PostgreSQL to provide:

- **Consistent behavior** across all environments
- **Atomic operations** for accurate rate tracking
- **Cost efficiency** by reusing existing database
- **Simple deployment** with no additional services

## Architecture

### Database Cache Backend

The system uses Django's database cache, which stores rate limit data in a dedicated table:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'django_cache',
    }
}
```

### Rate Limiter Implementation

The `DatabaseRateLimiter` class provides:

- Environment-isolated rate tracking
- Time-window based limiting
- Graceful error handling (fail-open)
- Atomic increment operations

## Configuration

### Environment Variables

Rate limiting can be configured through environment variables:

```bash
# Maximum submission attempts (default: 3)
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=3

# Time window in seconds (default: 300 = 5 minutes)
ENDORSEMENT_RATE_LIMIT_WINDOW=300
```

### Database Setup

The cache table is created automatically during deployment:

```bash
# Create cache table
python manage.py createcachetable

# For production (via Zappa)
zappa manage prod createcachetable
```

## Usage

### In Views

The rate limiter is primarily used in the endorsement submission flow:

```python
from coalition.core.database_rate_limiter import get_rate_limiter

def submit_endorsement(request):
    limiter = get_rate_limiter()
    ip_address = get_client_ip(request)

    # Check if rate limited
    if limiter.is_rate_limited(ip_address, max_attempts=3, window_seconds=300):
        return HttpResponse("Rate limit exceeded", status=429)

    # Process endorsement
    # ...
```

### Spam Prevention Integration

The `SpamPreventionService` automatically applies rate limiting:

```python
from coalition.endorsements.spam_prevention import SpamPreventionService

# Check rate limit
rate_limit_result = SpamPreventionService.check_rate_limit(request)
if not rate_limit_result["allowed"]:
    return JsonResponse({
        "error": rate_limit_result["message"],
        "retry_after": rate_limit_result["reset_in"]
    }, status=429)
```

## API

### DatabaseRateLimiter Methods

#### `is_rate_limited(key, max_attempts, window_seconds)`

Check if a key is rate limited.

**Parameters:**

- `key` (str): Identifier to rate limit (e.g., IP address)
- `max_attempts` (int): Maximum attempts allowed
- `window_seconds` (int): Time window in seconds

**Returns:** Boolean (True if rate limited)

#### `get_remaining_attempts(key, max_attempts, window_seconds)`

Get remaining attempts for a key.

**Returns:** Integer (number of remaining attempts)

#### `get_rate_limit_info(key, max_attempts, window_seconds)`

Get comprehensive rate limit information.

**Returns:** Dictionary with:

- `allowed`: Whether request is allowed
- `remaining`: Remaining attempts
- `total`: Total attempts allowed
- `reset_in`: Seconds until rate limit resets
- `current_count`: Current attempt count

#### `reset_limit(key)`

Reset rate limit for a specific key (useful for testing or admin actions).

## Implementation Details

### Time Windows

Rate limits use sliding time windows that automatically reset after the specified period:

```
Window 1: 10:00:00 - 10:05:00 (3 attempts allowed)
Window 2: 10:05:00 - 10:10:00 (3 attempts allowed)
```

### Key Isolation

Rate limit keys are isolated by environment to prevent cross-environment interference:

```
Production: "production:rate:192.168.1.1:w:1234567890"
Development: "dev:rate:192.168.1.1:w:1234567890"
```

### Atomic Operations

For database cache backends, the system uses atomic SQL operations to prevent race conditions:

```sql
INSERT INTO django_cache (cache_key, value, expires)
VALUES (%s, %s, %s)
ON CONFLICT (cache_key)
DO UPDATE SET value = /* increment logic */
```

## Security Considerations

### IP Address Extraction

The system includes secure IP extraction that:

- Validates IP addresses
- Handles proxy headers safely
- Prevents header spoofing attacks

### Fail-Open Behavior

If the rate limiting system encounters an error, it fails open (allows the request) to maintain availability while logging the error for investigation.

## Performance

### Efficiency

- **Database queries**: 1-2 per rate limit check
- **Cache expiry**: Automatic cleanup of expired entries
- **Memory usage**: Minimal (data stored in database)

### Scalability

The database-backed approach scales with your PostgreSQL instance and benefits from:

- Database connection pooling
- Query optimization
- Index performance

## Monitoring

### Logging

Rate limit events are logged for monitoring:

```python
# Rate limit exceeded
INFO: Rate limit exceeded for 192.168.1.1: 3/3

# Errors (fail-open)
ERROR: Rate limiter error for key 192.168.1.1: Database connection failed
```

### Metrics

Track rate limiting effectiveness through:

- Number of rate-limited requests
- Top rate-limited IPs
- Rate limit reset patterns

## Testing

### Unit Tests

The rate limiter includes comprehensive tests:

```bash
# Run rate limiter tests
python manage.py test coalition.core.tests.test_database_rate_limiter
```

### Manual Testing

Test rate limiting manually:

```python
from coalition.core.database_rate_limiter import DatabaseRateLimiter

limiter = DatabaseRateLimiter()

# Test rate limiting
for i in range(5):
    limited = limiter.is_rate_limited("test_key", 3, 60)
    print(f"Attempt {i+1}: {'blocked' if limited else 'allowed'}")
```

## Troubleshooting

### Common Issues

#### Cache Table Not Found

**Error:** `relation "django_cache" does not exist`

**Solution:** Run `python manage.py createcachetable`

#### Rate Limits Not Working

**Check:**

1. Cache backend configuration in settings
2. Database connectivity
3. Cache table exists and is accessible

#### Different Behavior in Dev/Prod

**Verify:**

- Same cache backend in all environments
- Same rate limit configuration values
- Database cache table created

## Migration from Redis/DynamoDB

The system previously used:

- **Redis** with django-ratelimit for local development
- **DynamoDB** for production Lambda environments

The new database-backed approach:

- Eliminates Redis dependency
- Removes DynamoDB costs (~$1/month)
- Provides consistent behavior everywhere
- Simplifies deployment and testing

## Future Enhancements

Potential improvements:

- Per-user rate limiting (in addition to IP-based)
- Configurable rate limits per endpoint
- Rate limit headers in responses (X-RateLimit-\*)
- Admin interface for monitoring and management
