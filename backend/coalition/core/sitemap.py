"""Sitemap generation for SEO."""

from datetime import datetime

from django.contrib.sitemaps import Sitemap
from django.db.models import QuerySet
from django.urls import reverse
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign
from coalition.content.models import ContentBlock

# Constants for sitemap configuration
# ContentBlock identifiers that should not be indexed
# Note: The actual /privacy and /terms pages are handled separately via Legal app
EXCLUDED_CONTENT_IDENTIFIERS = ["privacy-policy", "terms-of-service"]

# Use application start time as lastmod for static pages
# This prevents unnecessary recrawling by search engines
STATIC_PAGES_LASTMOD = timezone.now()


class StaticViewSitemap(Sitemap):
    """Sitemap for static pages."""

    priority = 1.0
    changefreq = "daily"

    def items(self) -> list[str]:
        """Return list of static page names."""
        return ["home"]

    def location(self, item: str) -> str:
        """Return URL for the item."""
        if item == "home":
            return "/"
        return reverse(item)

    def lastmod(self, item: str) -> datetime:  # noqa: ARG002
        """Return last modification date."""
        return STATIC_PAGES_LASTMOD


class CampaignSitemap(Sitemap):
    """Sitemap for campaign pages."""

    changefreq = "weekly"
    priority = 0.8

    def items(self) -> QuerySet[PolicyCampaign]:
        """Return all active campaigns."""
        return PolicyCampaign.objects.filter(active=True)

    def lastmod(self, obj: PolicyCampaign) -> datetime:
        """Return last modification date of the campaign."""
        return obj.updated_at

    def location(self, obj: PolicyCampaign) -> str:
        """Return the URL for the campaign."""
        # Frontend handles routing, so we return the frontend URL pattern
        return f"/campaigns/{obj.url_name}/"


class ContentPageSitemap(Sitemap):
    """Sitemap for content pages."""

    changefreq = "monthly"
    priority = 0.6

    def items(self) -> QuerySet[ContentBlock]:
        """Return all published content pages."""
        # Get pages that should be indexed
        return ContentBlock.objects.filter(
            block_type="page",
            active=True,
        ).exclude(
            identifier__in=EXCLUDED_CONTENT_IDENTIFIERS,
        )

    def lastmod(self, obj: ContentBlock) -> datetime:
        """Return last modification date."""
        return obj.updated_at

    def location(self, obj: ContentBlock) -> str:
        """Return the URL for the content page."""
        # Map content blocks to their frontend routes
        if obj.identifier == "about":
            return "/about/"
        elif obj.identifier == "contact":
            return "/contact/"
        else:
            return f"/content/{obj.identifier}/"


# Dictionary of sitemap classes
sitemaps = {
    "static": StaticViewSitemap,
    "campaigns": CampaignSitemap,
    "content": ContentPageSitemap,
}
