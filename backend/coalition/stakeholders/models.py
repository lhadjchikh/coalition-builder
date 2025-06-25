from django.contrib.gis.db.models import PointField
from django.db import models


class Stakeholder(models.Model):
    STAKEHOLDER_TYPE_CHOICES = [
        ("farmer", "Farmer"),
        ("waterman", "Waterman"),
        ("business", "Business"),
        ("nonprofit", "Nonprofit"),
        ("individual", "Individual"),
        ("government", "Government"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=200)
    organization = models.CharField(max_length=200)
    role = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)

    # Address fields
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    county = models.CharField(max_length=100, blank=True)

    # Geographic coordinates
    location = PointField(
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
    )
    state_senate_district = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_senate_stakeholders",
        limit_choices_to={"type": "state_senate_district"},
    )
    state_house_district = models.ForeignKey(
        "regions.Region",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_house_stakeholders",
        limit_choices_to={"type": "state_house_district"},
    )

    # Geocoding status
    geocoded_at = models.DateTimeField(auto_now_add=True)

    type = models.CharField(max_length=50, choices=STAKEHOLDER_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    def latitude(self) -> float:
        """Get latitude from location point"""
        return self.location.y

    @property
    def longitude(self) -> float:
        """Get longitude from location point"""
        return self.location.x

    def __str__(self) -> str:
        return f"{self.organization} – {self.name}"
