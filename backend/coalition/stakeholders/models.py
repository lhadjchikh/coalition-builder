from django.contrib.gis.db.models import PointField
from django.db import models


class Stakeholder(models.Model):
    """
    Represents individuals and organizations that can endorse policy campaigns.

    Stakeholders are automatically geocoded and assigned to legislative districts
    based on their address, including congressional districts, state senate districts,
    and state house districts. They can endorse multiple campaigns and are categorized
    by type (business, nonprofit, individual, etc.).

    The model includes comprehensive address fields and geographic coordinates
    for mapping and district assignment purposes.
    """

    STAKEHOLDER_TYPE_CHOICES = [
        ("farmer", "Farmer"),
        ("waterman", "Waterman"),
        ("business", "Business"),
        ("nonprofit", "Nonprofit"),
        ("individual", "Individual"),
        ("government", "Government"),
        ("other", "Other"),
    ]

    # Name fields - separate first and last name
    first_name = models.CharField(
        max_length=100,
        help_text="First name of the individual or primary contact person",
    )
    last_name = models.CharField(
        max_length=100,
        help_text="Last name of the individual or primary contact person",
    )
    organization = models.CharField(
        max_length=200,
        blank=True,
        help_text="Organization or company name (leave blank for individuals "
        "not representing an organization)",
    )
    role = models.CharField(
        max_length=100,
        blank=True,
        help_text="Job title or role within the organization",
    )
    email = models.EmailField(
        unique=True,
        help_text="Primary email address for verification and communication",
    )

    # Address fields
    street_address = models.CharField(
        max_length=255,
        help_text="Street address including number and street name",
    )
    city = models.CharField(max_length=100, help_text="City or town name")
    state = models.CharField(
        max_length=2,
        help_text="Two-letter state abbreviation (e.g., 'CA', 'NY')",
    )
    zip_code = models.CharField(max_length=10, help_text="ZIP or postal code")
    county = models.CharField(
        max_length=100,
        blank=True,
        help_text="County name (optional, auto-populated when possible)",
    )

    # Geographic coordinates
    location = PointField(
        null=True,
        blank=True,
        spatial_index=True,
        geography=True,
        verbose_name="Geographic Location",
        help_text="Latitude and longitude coordinates",
    )

    # District relationships
    congressional_district = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="congressional_stakeholders",
        limit_choices_to={"type": "congressional_district"},
        help_text="Congressional district assigned based on address geocoding",
    )
    state_senate_district = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_senate_stakeholders",
        limit_choices_to={"type": "state_senate_district"},
        help_text="State senate district assigned based on address geocoding",
    )
    state_house_district = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_house_stakeholders",
        limit_choices_to={"type": "state_house_district"},
        help_text="State house district assigned based on address geocoding",
    )

    type = models.CharField(
        max_length=50,
        choices=STAKEHOLDER_TYPE_CHOICES,
        help_text="Category of stakeholder (business, nonprofit, individual, etc.)",
    )
    email_updates = models.BooleanField(
        default=False,
        help_text="Whether stakeholder opted in to receive policy email updates",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when stakeholder record was first created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when stakeholder record was last modified",
    )

    def save(self, *args: object, **kwargs: object) -> None:
        """Normalize email and state to consistent format"""
        if self.email:
            self.email = self.email.lower()
        if self.state:
            self.state = self.state.upper()
        if self.zip_code:
            self.zip_code = self.zip_code.strip()
        super().save(*args, **kwargs)

    @property
    def name(self) -> str:
        """Return full name from first and last name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return ""

    @property
    def full_address(self) -> str:
        """Return formatted full address"""
        parts = []
        if self.street_address:
            parts.append(self.street_address)
        if self.city:
            parts.append(self.city)
        if self.state:
            state_zip = self.state
            if self.zip_code:
                state_zip += f" {self.zip_code}"
            parts.append(state_zip)
        return ", ".join(parts)

    @property
    def latitude(self) -> float | None:
        """Get latitude from location point"""
        return self.location.y if self.location else None

    @property
    def longitude(self) -> float | None:
        """Get longitude from location point"""
        return self.location.x if self.location else None

    class Meta:
        db_table = "stakeholder"

    def __str__(self) -> str:
        if self.organization:
            return f"{self.organization} – {self.name}"
        return self.name
