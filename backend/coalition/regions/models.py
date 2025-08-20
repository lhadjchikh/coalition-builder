from django.contrib.gis.db.models import MultiPolygonField, PointField
from django.db import models

from coalition.stakeholders.constants import DistrictType


class Region(models.Model):
    REGION_TYPE_CHOICES = [
        ("state", "State"),
        ("county", "County"),
        (
            DistrictType.CONGRESSIONAL,
            DistrictType.get_display_name(DistrictType.CONGRESSIONAL),
        ),
        (
            DistrictType.STATE_SENATE,
            DistrictType.get_display_name(DistrictType.STATE_SENATE),
        ),
        (
            DistrictType.STATE_HOUSE,
            DistrictType.get_display_name(DistrictType.STATE_HOUSE),
        ),
    ]

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent region (e.g., state for a county)",
    )
    geoid = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Geographic identifier from Census data",
    )
    name = models.CharField(
        unique=True,
        max_length=255,
        help_text="Full name of the region",
    )
    label = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Alternative display label for the region",
    )
    abbrev = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        help_text="Abbreviation for the region (e.g., 'MD', 'CA-12', 'MD-Montgomery')",
    )
    type = models.CharField(
        choices=REGION_TYPE_CHOICES,
        max_length=30,
        db_index=True,
        help_text="Type of region (state, county, congressional district, etc.)",
    )
    coords = PointField(
        blank=True,
        null=True,
        spatial_index=True,
        geography=True,
        verbose_name="coordinates",
        help_text="Internal point",
    )
    geom = MultiPolygonField(
        blank=True,
        null=True,
        spatial_index=True,
        help_text="Full geometry for spatial operations",
    )
    geojson = models.JSONField(
        blank=True,
        null=True,
        help_text="Simplified geometry suitable for thematic mapping.",
    )

    class Meta:
        db_table = "region"
        constraints = [
            models.UniqueConstraint(
                fields=["geoid", "type"],
                name="unique__geoid__type",
            ),
        ]

    def __str__(self) -> str:
        return self.name

    def natural_key(self) -> tuple[str]:
        return (self.name,)
