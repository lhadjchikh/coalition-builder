"""
Django settings for coalition project.

Generated by 'django-admin startproject' using Django 5.2.1.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

import json
import os
import sys
from pathlib import Path
from urllib.parse import quote

import dj_database_url
import requests

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-=lvqp2vsu5)=!t*_qzm3%h%7btagcgw1#cj^sut9f@95^vbclv",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

# Parse ALLOWED_HOSTS from environment variable
# Support both JSON array format and comma-separated string format
allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
try:
    # Try to parse as JSON array first
    allowed_hosts_list = json.loads(allowed_hosts_env)
except (json.JSONDecodeError, ValueError):
    # Fall back to comma-separated string
    allowed_hosts_list = [host.strip() for host in allowed_hosts_env.split(",")]

# Use set to eliminate duplicates
allowed_hosts_set = set(allowed_hosts_list)

# Add testserver for Django tests
if "test" in sys.argv or "testserver" not in allowed_hosts_set:
    allowed_hosts_set.add("testserver")

# Add internal service hostnames for Docker/ECS communication
# These are used by containers to communicate with each other
if os.getenv("ENVIRONMENT", "local") in ("local", "docker", "development"):
    internal_hosts = ["api", "nginx", "ssr"]
    for host in internal_hosts:
        allowed_hosts_set.add(host)

# For Elastic Container Service (ECS) deployments, get the internal IP
# address from the EC2 instance's metadata and add it to ALLOWED_HOSTS.
# This prevents health checks from failing due to disallowed host.
# See: https://stackoverflow.com/a/58595305/1143466
if metadata_uri := os.getenv("ECS_CONTAINER_METADATA_URI"):
    container_metadata = requests.get(metadata_uri).json()
    container_ip_address = container_metadata["Networks"][0]["IPv4Addresses"][0]
    allowed_hosts_set.add(container_ip_address)

# Convert set to list once at the end
ALLOWED_HOSTS = list(allowed_hosts_set)

# CSRF Protection Configuration
# Define trusted origins for CSRF token validation
# This should include all domains that will make requests to the Django API
CSRF_TRUSTED_ORIGINS = []

# Parse from environment variable (comma-separated URLs with protocols)
csrf_origins_env = os.getenv("CSRF_TRUSTED_ORIGINS", "")
if csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_origins_env.split(",")]

# Add default origins for development
if DEBUG:
    default_origins = [
        "http://localhost:3000",  # Next.js frontend
        "http://127.0.0.1:3000",
        "http://localhost:8000",  # Django development server
        "http://127.0.0.1:8000",
    ]
    for origin in default_origins:
        if origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)

# Additional CSRF security settings
CSRF_COOKIE_SECURE = not DEBUG  # Only send CSRF cookie over HTTPS in production
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access to CSRF token
CSRF_COOKIE_SAMESITE = "Lax"  # Reasonable default for most applications
CSRF_USE_SESSIONS = False  # Use cookie-based CSRF tokens (more flexible)

# Security settings for AWS ALB
# Tell Django to trust the X-Forwarded-Proto header from the load balancer
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Use the X-Forwarded-Host header from the load balancer
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

ORGANIZATION_NAME = os.getenv("ORGANIZATION_NAME", "Coalition Builder")
TAGLINE = os.getenv("ORG_TAGLINE", "Building strong advocacy partnerships")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "info@example.org")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_extensions",
    "django_ratelimit",
    "lockdown",
    "storages",
    "tinymce",
    "coalition.content.apps.ContentConfig",
    "coalition.campaigns.apps.CampaignsConfig",
    "coalition.legislators.apps.LegislatorsConfig",
    "coalition.regions.apps.RegionsConfig",
    "coalition.stakeholders",
    "coalition.endorsements",
    "coalition.legal.apps.LegalConfig",
]

# Configure database table names to maintain backward compatibility
DATABASE_ROUTERS = []
DEFAULT_APP_CONFIG = None

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "coalition": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

MIDDLEWARE = [
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "lockdown.middleware.LockdownMiddleware",
    # ETagMiddleware placed after security middleware to process final response
    # but before any response compression that might change content
    "coalition.core.middleware.etag.ETagMiddleware",
]

ROOT_URLCONF = "coalition.core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],  # Add this line
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "coalition.core.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# Use SQLite as a fallback if DATABASE_URL is not set
if os.getenv("DATABASE_URL"):
    # Parse DATABASE_URL and ensure PostGIS is used for PostgreSQL
    db_config = dj_database_url.config(default=quote(os.getenv("DATABASE_URL", "")))

    # If using PostgreSQL, make sure to use the PostGIS backend
    if db_config.get("ENGINE") == "django.db.backends.postgresql":
        db_config["ENGINE"] = "django.contrib.gis.db.backends.postgis"

    # For tests, use admin user to create test databases with PostGIS extension
    if "test" in sys.argv:
        # Use admin credentials for test database creation
        db_config.update(
            {
                "USER": "coalition_admin",
                "PASSWORD": "admin_password",
            },
        )

    DATABASES = {
        "default": db_config,
    }
else:
    # Use SpatiaLite for GeoDjango support
    DATABASES = {
        "default": {
            "ENGINE": "django.contrib.gis.db.backends.spatialite",
            "NAME": BASE_DIR / "db.sqlite3",
        },
    }

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

# Static files URL - use CloudFront CDN when available
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN")
STATIC_URL = f"https://{CLOUDFRONT_DOMAIN}/static/" if CLOUDFRONT_DOMAIN else "/static/"

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Static files directories - where Django will look for static files during development
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

# Add frontend build directory for local development
# Check if we're running in Docker (has mounted frontend build) or locally
frontend_build_static = os.path.join(BASE_DIR.parent, "frontend", "build", "static")
docker_frontend_build_static = "/app/frontend/build/static"

if os.path.exists(docker_frontend_build_static):
    # Running in Docker container with mounted frontend build
    STATICFILES_DIRS.append(docker_frontend_build_static)
elif os.path.exists(frontend_build_static):
    # Running locally with frontend build in parent directory
    STATICFILES_DIRS.append(frontend_build_static)

# Additional static file finder configuration
STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Email configuration
# https://docs.djangoproject.com/en/5.2/topics/email/

if DEBUG:
    # Development: Log emails to console
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    # Production: Use SMTP
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1", "t")
    EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

# Default sender for system emails
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", CONTACT_EMAIL)
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Site configuration for email links
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")  # Frontend URL
API_URL = os.getenv("API_URL", "http://localhost:8000")  # Backend URL

# Admin notification emails for endorsement system
ADMIN_NOTIFICATION_EMAILS = os.getenv("ADMIN_NOTIFICATION_EMAILS", "")

# Endorsement moderation settings
# Default to manual review for better content control in production
# Set AUTO_APPROVE_VERIFIED_ENDORSEMENTS=true in environment to enable auto-approval
AUTO_APPROVE_VERIFIED_ENDORSEMENTS = os.getenv(
    "AUTO_APPROVE_VERIFIED_ENDORSEMENTS",
    "false",
).lower() in ("true", "1", "t")

# Akismet spam detection
AKISMET_SECRET_API_KEY = os.getenv("AKISMET_SECRET_API_KEY")

# Geocoding configuration
# Tiger geocoder confidence threshold (lower rating = better accuracy)
# Default: 20 (reasonable confidence for most use cases)
# Range: 0-100, where 0 is exact match and 100 is no match
# Recommended values:
#   - Urban areas: 10-15 (stricter matching)
#   - Suburban areas: 15-25 (balanced)
#   - Rural areas: 20-30 (more lenient)
TIGER_GEOCODING_CONFIDENCE_THRESHOLD = int(
    os.getenv("TIGER_GEOCODING_CONFIDENCE_THRESHOLD", "20"),
)

# Cache configuration
# Always use Redis cache for consistency across all environments
# This ensures django-ratelimit works properly in all scenarios
CACHE_URL = os.getenv("CACHE_URL", "redis://redis:6379/1")

# Use locmem cache during tests and disable ratelimit checks
if "test" in sys.argv:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "test-cache",
        },
    }
    # Disable django-ratelimit system checks during tests
    SILENCED_SYSTEM_CHECKS = ["django_ratelimit.E003", "django_ratelimit.W001"]
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": CACHE_URL,
        },
    }

# TinyMCE Configuration
TINYMCE_DEFAULT_CONFIG = {
    "theme": "silver",
    "height": 300,
    "menubar": False,
    "plugins": [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "charmap",
        "preview",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "insertdatetime",
        "media",
        "table",
        "help",
        "wordcount",
        "codesample",
    ],
    "toolbar": (
        "undo redo | blocks | bold italic underline strikethrough | "
        "alignleft aligncenter alignright alignjustify | "
        "bullist numlist outdent indent | link image media | "
        "removeformat | code | help"
    ),
    "block_formats": (
        "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; "
        "Heading 4=h4; Heading 5=h5; Heading 6=h6; "
        "Preformatted=pre; Blockquote=blockquote"
    ),
    "image_advtab": True,
    "image_caption": True,
    "relative_urls": False,
    "remove_script_host": True,
    "convert_urls": True,
    "cleanup_on_startup": True,
    "custom_undo_redo_levels": 20,
    "entity_encoding": "raw",
    "content_style": """
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 14px;
            line-height: 1.6;
        }
    """,
}

# TinyMCE minimal configuration for simple fields
TINYMCE_MINIMAL_CONFIG = {
    "theme": "silver",
    "height": 200,
    "menubar": False,
    "plugins": ["link", "lists", "autolink"],
    "toolbar": "bold italic | bullist numlist | link | removeformat",
    "statusbar": False,
}

# Site Password Protection (django-lockdown)
LOCKDOWN_ENABLED = os.getenv("SITE_PASSWORD_ENABLED", "false").lower() in (
    "true",
    "1",
    "yes",
)
LOCKDOWN_PASSWORDS = [os.getenv("SITE_PASSWORD", "changeme")]
LOCKDOWN_URL_EXCEPTIONS = [
    r"^/health/$",  # Django health check
    r"^/health$",  # Next.js health check
    r"^/admin/",  # Django admin (has its own auth)
    r"^/api/",  # API endpoints
]

# Session-based lockdown (user stays logged in)
LOCKDOWN_SESSION_LOCKDOWN = True


# File Storage Configuration (django-storages with S3)
STORAGES = {
    "default": {
        "BACKEND": "coalition.core.storage.MediaStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# AWS S3 Configuration
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_REGION_NAME = os.getenv("AWS_REGION", "us-east-1")

# Explicitly tell django-storages to use the default credential chain
# This is important for ECS task roles
AWS_S3_ACCESS_KEY_ID = None
AWS_S3_SECRET_ACCESS_KEY = None
AWS_S3_SESSION_TOKEN = None

# Force boto3 to use the container credentials provider
# This helps when running in ECS/Fargate
AWS_S3_SIGNATURE_VERSION = "s3v4"

# Use CloudFront domain for generating URLs when available
if CLOUDFRONT_DOMAIN:
    AWS_S3_CUSTOM_DOMAIN = CLOUDFRONT_DOMAIN
else:
    AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"

# S3 File Settings
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",  # Cache for 1 day
}
AWS_S3_FILE_OVERWRITE = False  # Don't overwrite files with same name
AWS_DEFAULT_ACL = "public-read"  # Make uploaded files publicly readable
AWS_S3_VERIFY_SSL = True

# Media files configuration
# Use CloudFront CDN when available for better performance and security
if CLOUDFRONT_DOMAIN:
    MEDIA_URL = f"https://{CLOUDFRONT_DOMAIN}/media/"
else:
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
MEDIA_ROOT = "/media/"
