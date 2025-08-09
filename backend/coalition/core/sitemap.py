"""Sitemap generation for SEO."""

from datetime import datetime

from django.contrib.sitemaps import Sitemap
from django.db.models import QuerySet
from django.urls import reverse
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign

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
        return obj.created_at

    def location(self, obj: PolicyCampaign) -> str:
        """Return the URL for the campaign."""
        # Frontend handles routing, so we return the frontend URL pattern
        return f"/campaigns/{obj.name}/"


# ContentPageSitemap removed - ContentBlock model is for homepage sections,
# not standalone pages. Standalone content pages should be handled by dedicated models.


# Dictionary of sitemap classes
sitemaps = {
    "static": StaticViewSitemap,
    "campaigns": CampaignSitemap,
}
