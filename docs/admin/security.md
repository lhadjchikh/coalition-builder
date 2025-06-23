# Security Features

This document outlines the comprehensive security measures implemented in Coalition Builder to protect against common web application vulnerabilities and abuse.

## Overview

Coalition Builder implements defense-in-depth security with multiple layers of protection:

- **Spam Prevention**: Multi-factor spam detection using professional services and custom algorithms
- **Rate Limiting**: Secure IP-based rate limiting to prevent abuse and DoS attacks
- **Data Protection**: Prevents unauthorized modification of user data and verified endorsements
- **Input Validation**: Comprehensive validation and sanitization of all user inputs
- **Access Controls**: Role-based permissions for administrative functions

## Spam Prevention System

### Multi-Layer Protection

The spam prevention system uses multiple detection methods:

1. **Akismet Integration**: Professional spam detection service for content analysis
2. **Email Validation**: MX record verification and disposable email detection
3. **Honeypot Fields**: Hidden form fields that detect automated submissions
4. **Timing Analysis**: Detects submissions that are too fast (bots) or too slow (abandoned forms)
5. **Content Quality**: Pattern analysis for suspicious names, organizations, and statements

### Configuration

Spam prevention is configured through environment variables:

```bash
# Akismet API key for professional spam detection
AKISMET_SECRET_API_KEY=your_akismet_api_key

# Site URL for Akismet verification
SITE_URL=https://yourdomain.com

# Rate limiting configuration
ENDORSEMENT_RATE_LIMIT_WINDOW=300  # 5 minutes
ENDORSEMENT_RATE_LIMIT_MAX_ATTEMPTS=3  # 3 attempts per window
```

### Spam Detection Process

When an endorsement is submitted:

1. **Rate Limit Check**: Verify the IP hasn't exceeded submission limits
2. **Honeypot Validation**: Ensure hidden fields remain empty
3. **Timing Validation**: Check submission time is within reasonable bounds (5 seconds to 30 minutes)
4. **Email Reputation**: Validate email address and check for disposable domains
5. **Content Analysis**: Analyze stakeholder and statement content for spam indicators
6. **Akismet Check**: Submit to Akismet for professional spam detection
7. **Confidence Scoring**: Combine all factors into a confidence score (0.0-1.0)

Submissions with confidence scores >= 0.7 are automatically rejected.

## Rate Limiting System

### Secure IP Extraction

Rate limiting uses a custom IP extraction function that prevents spoofing:

```python
def get_client_ip(request: HttpRequest) -> str:
    """
    Securely extract client IP with validation and spoofing protection.
    """
    # Validates IP addresses and handles proxy headers safely
    # Only trusts X-Forwarded-For from private IP addresses (reverse proxies)
    # Prevents rate limit bypass through header spoofing
```

### Rate Limiting Endpoints

The following endpoints are rate limited:

- **Endorsement Creation**: 3 submissions per 5 minutes per IP
- **Email Verification**: 3 attempts per 5 minutes per IP
- **Resend Verification**: 3 requests per 5 minutes per IP

### Redis Cache Backend

Rate limiting requires a shared cache backend for proper operation:

- **Development**: Redis container in docker-compose
- **Production**: Redis container in ECS with persistence
- **Testing**: Dummy cache backend to avoid interference

## Data Protection

### Stakeholder Data Protection

Prevents unauthorized modification of existing stakeholder data:

1. **Exact Match Validation**: Updates only allowed if all fields match exactly
2. **Case-Insensitive Comparison**: Improves usability while maintaining security
3. **Security Logging**: All takeover attempts are logged with IP addresses
4. **Error Messages**: Generic error messages prevent information disclosure

### Verified Endorsement Protection

Once an endorsement is email-verified, it cannot be modified:

1. **Immutable After Verification**: Verified endorsements are read-only
2. **Security Logging**: Modification attempts are logged as security events
3. **User-Friendly Messages**: Clear error messages direct users to support

### Example Attack Prevention

```bash
# Attacker tries to overwrite John Doe's data
POST /api/endorsements/
{
  "stakeholder": {
    "name": "Evil Hacker",      # Different from existing "John Doe"
    "email": "john@acme.com"    # Same email as existing stakeholder
  }
}

# Response: 409 Conflict
# "A stakeholder with this email already exists with different information"
# Logged: "Attempt to modify existing stakeholder data for john@acme.com from IP 1.2.3.4"
```

## Input Validation and Sanitization

### CSV Export Protection

Prevents CSV formula injection attacks:

```python
def sanitize_csv_field(value: str) -> str:
    """Prevent formula injection by prefixing dangerous characters"""
    if value and value[0] in ("=", "+", "-", "@", "|"):
        return "'" + value  # Prefix with single quote
    return value
```

### Form Data Validation

All form inputs are validated:

- **Email**: Format validation and MX record verification
- **State**: Validated against allowed state codes
- **Stakeholder Type**: Restricted to predefined types
- **Statement**: Length limits and content analysis

## Access Controls

### Admin Endpoints

Administrative endpoints require authentication:

- **Approval/Rejection**: Staff users only
- **Data Export**: Staff users only
- **Pending Review**: Staff users only
- **Bulk Actions**: Staff users only

### Privacy-Preserving Responses

Certain endpoints use privacy-preserving responses to prevent information disclosure:

```python
# Resend verification always returns the same message
"If an endorsement exists for this email and campaign, a verification email has been sent."
```

This prevents attackers from determining which emails have endorsements.

## Security Monitoring

### Logging

Security events are comprehensively logged:

- **Spam Detection**: All spam attempts with confidence scores and reasons
- **Rate Limiting**: Rate limit violations with IP addresses
- **Data Tampering**: Stakeholder data modification attempts
- **Verification Tampering**: Attempts to modify verified endorsements
- **Access Violations**: Unauthorized access to admin endpoints

### Log Examples

```
WARNING - Spam detected from IP 192.168.1.100: ['Honeypot field filled', 'Suspicious timing']
WARNING - Attempt to modify existing stakeholder data for john@acme.com from IP 1.2.3.4. Data mismatch detected.
WARNING - Attempt to modify verified endorsement 123 for john@acme.com from IP 1.2.3.4
INFO - Suspicious endorsement from IP 192.168.1.100: ['Test email pattern detected']
```

## Redis Cache Setup

### Development Setup

Redis is automatically configured in docker-compose:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
```

### Production Deployment

Redis runs as a container in ECS:

- **Resource Allocation**: 128 CPU units, 128MB RAM
- **Persistence**: Append-only file (AOF) for data durability
- **Memory Management**: LRU eviction when memory limit reached
- **Health Checks**: Redis PING command for container health

### Cache Configuration

Cache settings automatically detect the environment:

```python
# Redis when CACHE_URL is set to redis://
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
    }
}

# Dummy cache for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}
```

## Testing

Comprehensive security tests verify all protections:

### Security Test Classes

1. **SecurityVulnerabilityTests**: Tests data protection and rate limiting
2. **RedisIntegrationTests**: Tests cache backend integration

### Running Security Tests

```bash
# Run all security tests
python manage.py test coalition.endorsements.tests.SecurityVulnerabilityTests

# Run Redis integration tests
python manage.py test coalition.endorsements.tests.RedisIntegrationTests

# Run all endorsement tests (includes security tests)
python manage.py test coalition.endorsements.tests
```

### Test Coverage

Security tests cover:

- Stakeholder data overwrite prevention
- Verified endorsement modification prevention
- Rate limiting with IP spoofing protection
- CSV formula injection prevention
- Access control enforcement
- Cache backend functionality

## Security Recommendations

### For Administrators

1. **Monitor Logs**: Regularly review security logs for suspicious activity
2. **Update Dependencies**: Keep Akismet and other security dependencies updated
3. **Rate Limit Monitoring**: Monitor rate limiting effectiveness and adjust thresholds
4. **Email Verification**: Ensure email verification is working properly

### For Developers

1. **Input Validation**: Always validate and sanitize user inputs
2. **Rate Limiting**: Apply rate limiting to new endpoints that accept user input
3. **Access Controls**: Implement proper authentication for admin functionality
4. **Security Testing**: Write tests for security vulnerabilities

### For Deployment

1. **Redis Security**: Use Redis AUTH in production if Redis is exposed
2. **HTTPS Only**: Ensure all traffic uses HTTPS in production
3. **IP Allowlisting**: Consider IP restrictions for admin endpoints
4. **Monitoring**: Set up alerts for security log events

## Incident Response

If a security incident is detected:

1. **Immediate**: Check logs for the scope of the incident
2. **Analysis**: Determine if data was compromised
3. **Mitigation**: Implement additional controls if needed
4. **Communication**: Notify stakeholders if personal data was affected
5. **Prevention**: Update security measures to prevent similar incidents

For security concerns, contact the development team immediately.

## Related Documentation

- [Environment Variables Reference](../reference/environment.md) - Configuration details
- [API Documentation](../api/index.md) - API security features
- [Troubleshooting Guide](troubleshooting.md) - Common security issues
- [Development Testing](../development/testing.md) - Running security tests
