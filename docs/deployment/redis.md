# Redis Cache Setup

Redis is used as the cache backend for Coalition Builder to support rate limiting, session storage, and general caching. This guide covers Redis setup for development and production environments.

## Overview

Redis provides:

- **Rate Limiting**: Atomic operations for secure rate limit counters
- **Session Storage**: Fast session data access
- **General Caching**: Improved application performance
- **Data Persistence**: Optional data durability across restarts

## Development Setup

### Docker Compose (Recommended)

Redis is automatically configured in the provided docker-compose.yml:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 5
```

### Starting Redis

```bash
# Start all services including Redis
docker-compose up -d

# Start only Redis
docker-compose up -d redis

# Check Redis status
docker-compose ps redis
```

### Local Redis Installation

If you prefer to run Redis locally without Docker:

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
sudo systemctl enable redis
```

## Production Setup

### ECS Container Configuration

Redis runs as a sidecar container in the ECS task definition:

```json
{
  "name": "redis",
  "image": "redis:7-alpine",
  "essential": false,
  "cpu": 128,
  "memory": 128,
  "portMappings": [
    {
      "containerPort": 6379,
      "hostPort": 6379,
      "protocol": "tcp"
    }
  ],
  "command": [
    "redis-server",
    "--appendonly",
    "yes",
    "--maxmemory",
    "96mb",
    "--maxmemory-policy",
    "allkeys-lru"
  ]
}
```

### Resource Allocation

**Development:**

- CPU: 128 CPU units
- Memory: 128MB RAM
- Storage: Docker volume with persistence

**Production:**

- CPU: 128 CPU units
- Memory: 128MB RAM (96MB max for Redis data)
- Storage: ECS ephemeral storage with AOF persistence

### Cost Estimation

Running Redis as a container vs managed service:

| Option          | Monthly Cost | Pros                     | Cons                             |
| --------------- | ------------ | ------------------------ | -------------------------------- |
| **Container**   | $2-5         | Full control, low cost   | Manual management                |
| **ElastiCache** | $15-50+      | Managed service, scaling | Higher cost, vendor lock-in      |
| **Redis Cloud** | $15-30+      | Managed Redis experts    | Higher cost, external dependency |

## Configuration

### Environment Variables

```bash
# Redis connection URL
CACHE_URL=redis://redis:6379/1  # Docker Compose
CACHE_URL=redis://localhost:6379/1  # Local Redis

# For production with authentication
CACHE_URL=redis://:password@redis:6379/1
```

### Django Settings

The cache configuration automatically detects Redis:

```python
# When CACHE_URL starts with redis://
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
            },
        },
    }
}
```

### Redis Configuration Options

The Redis container uses optimized settings:

```bash
# Persistence
--appendonly yes              # Enable AOF persistence

# Memory Management
--maxmemory 96mb             # Limit memory usage
--maxmemory-policy allkeys-lru  # Evict least recently used keys

# Performance
--tcp-keepalive 60           # Keep connections alive
--timeout 0                  # No client timeout
```

## Monitoring and Maintenance

### Health Checks

Redis health is monitored through:

```bash
# Container health check
redis-cli ping  # Should return PONG

# Manual connection test
redis-cli -h redis -p 6379 ping

# Check Redis info
redis-cli info memory
redis-cli info persistence
```

### Performance Monitoring

Key metrics to monitor:

```bash
# Memory usage
redis-cli info memory | grep used_memory_human

# Connection count
redis-cli info clients | grep connected_clients

# Commands per second
redis-cli info stats | grep instantaneous_ops_per_sec

# Persistence status
redis-cli info persistence | grep aof_enabled
```

### Log Monitoring

Check Redis logs for issues:

```bash
# Docker Compose logs
docker-compose logs redis

# ECS logs (in CloudWatch)
# Log group: /ecs/your-prefix
# Log stream: redis/*
```

## Data Persistence

### Append-Only File (AOF)

Redis uses AOF for data persistence:

- **AOF Enabled**: `--appendonly yes`
- **Fsync Policy**: Every second (default)
- **Auto-Rewrite**: When AOF grows 100% and is >64MB

### Backup and Recovery

```bash
# Manual backup (development)
docker-compose exec redis redis-cli bgsave

# Copy AOF file
docker cp container_name:/data/appendonly.aof ./backup/

# Restore from AOF
# 1. Stop Redis
# 2. Replace AOF file
# 3. Start Redis
```

## Security

### Development Security

For development, Redis runs without authentication since it's isolated in Docker networks.

### Production Security

Consider these security measures for production:

```bash
# Enable authentication
--requirepass your_secure_password

# Bind to specific interface
--bind 127.0.0.1

# Disable dangerous commands
--rename-command FLUSHDB ""
--rename-command FLUSHALL ""
--rename-command CONFIG ""
```

Update environment variable:

```bash
CACHE_URL=redis://:your_secure_password@redis:6379/1
```

### Network Security

In ECS, Redis only accepts connections from:

- Application containers in the same task
- No external network access
- Security groups restrict access

## Troubleshooting

### Common Issues

**Redis Not Starting:**

```bash
# Check if port is in use
netstat -tlnp | grep 6379

# Check Docker logs
docker-compose logs redis

# Check disk space
df -h
```

**Connection Refused:**

```bash
# Verify Redis is running
docker-compose ps redis

# Check network connectivity
docker-compose exec app ping redis

# Test Redis connection
docker-compose exec app redis-cli -h redis ping
```

**Memory Issues:**

```bash
# Check memory usage
redis-cli info memory

# Check for memory pressure
docker stats redis

# Adjust memory limits if needed
```

**Data Loss:**

```bash
# Check AOF status
redis-cli info persistence

# Verify AOF file exists
ls -la /data/appendonly.aof

# Check for corruption
redis-check-aof appendonly.aof
```

### Performance Issues

**High Memory Usage:**

- Check key count: `redis-cli dbsize`
- Analyze key patterns: `redis-cli --scan --pattern "*"`
- Consider increasing memory limit or adding eviction

**Slow Responses:**

- Check slow log: `redis-cli slowlog get 10`
- Monitor commands: `redis-cli monitor`
- Consider connection pooling adjustments

## Alternatives

### Without Redis

If Redis is not available, the application falls back to:

```python
# Local memory cache (development only)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
```

**Limitations:**

- Rate limiting doesn't work across multiple processes
- No persistence across restarts
- Cache not shared between containers

### Database Cache

Alternative cache backend:

```python
# Database cache (requires table creation)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'coalition_cache_table',
    }
}
```

Create cache table:

```bash
python manage.py createcachetable
```

## Migration

### From No Cache to Redis

1. Add Redis to docker-compose.yml
2. Set `CACHE_URL=redis://redis:6379/1`
3. Restart application
4. Verify rate limiting works

### From Database Cache to Redis

1. Deploy Redis container
2. Update `CACHE_URL` environment variable
3. Remove database cache table (optional)
4. Monitor for improved performance

## Related Documentation

- [Environment Variables](../reference/environment.md) - Cache configuration
- [Security Features](../admin/security.md) - Rate limiting security
- [Docker Deployment](docker.md) - Container orchestration
- [AWS Deployment](aws.md) - ECS configuration
