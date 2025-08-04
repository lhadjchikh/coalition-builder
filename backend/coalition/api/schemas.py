from datetime import datetime
from typing import TYPE_CHECKING

from ninja import ModelSchema, Schema
from pydantic import Field, validator

from coalition.stakeholders.validators import AddressValidator

if TYPE_CHECKING:

    from coalition.content.models import ContentBlock, HomePage, Theme

# Import models for ModelSchema
from coalition.campaigns.models import Bill, PolicyCampaign
from coalition.content.models import ContentBlock, HomePage, Theme, Video
from coalition.endorsements.models import Endorsement
from coalition.legislators.models import Legislator
from coalition.stakeholders.models import Stakeholder


class PolicyCampaignOut(ModelSchema):
    """Response schema for PolicyCampaign model."""

    # Add computed fields for image data
    image_url: str | None = None
    image_alt_text: str | None = None
    image_author: str | None = None
    image_license: str | None = None
    image_source_url: str | None = None
    image_caption: str | None = None
    image_caption_display: str | None = None

    class Meta:
        model = PolicyCampaign
        fields = "__all__"

    @staticmethod
    def resolve_image_url(obj: PolicyCampaign) -> str | None:
        """Get the image URL if an image is associated."""
        if obj.image:
            return obj.image.image_url
        return None

    @staticmethod
    def resolve_image_alt_text(obj: PolicyCampaign) -> str | None:
        """Get the image alt text if an image is associated."""
        if obj.image:
            return obj.image.alt_text
        return None

    @staticmethod
    def resolve_image_author(obj: PolicyCampaign) -> str | None:
        """Get the image author if an image is associated."""
        if obj.image:
            return obj.image.author
        return None

    @staticmethod
    def resolve_image_license(obj: PolicyCampaign) -> str | None:
        """Get the image license if an image is associated."""
        if obj.image:
            return obj.image.license
        return None

    @staticmethod
    def resolve_image_source_url(obj: PolicyCampaign) -> str | None:
        """Get the image source URL if an image is associated."""
        if obj.image:
            return obj.image.source_url
        return None

    @staticmethod
    def resolve_image_caption(obj: PolicyCampaign) -> str | None:
        """Get the image caption if an image is associated."""
        if obj.image:
            return obj.image.caption
        return None

    @staticmethod
    def resolve_image_caption_display(obj: PolicyCampaign) -> str | None:
        """Get the image caption display setting if an image is associated."""
        if obj.image:
            return obj.image.caption_display
        return None


class StakeholderOut(ModelSchema):
    """Response schema for Stakeholder model with computed geographic fields."""

    # Additional computed fields
    latitude: float | None = None
    longitude: float | None = None
    congressional_district_name: str | None = None
    congressional_district_abbrev: str | None = None
    state_senate_district_name: str | None = None
    state_senate_district_abbrev: str | None = None
    state_house_district_name: str | None = None
    state_house_district_abbrev: str | None = None

    class Meta:
        model = Stakeholder
        exclude = ["location"]

    @staticmethod
    def resolve_latitude(obj: "Stakeholder") -> float | None:
        return obj.latitude

    @staticmethod
    def resolve_longitude(obj: "Stakeholder") -> float | None:
        return obj.longitude

    @staticmethod
    def resolve_congressional_district_name(obj: "Stakeholder") -> str | None:
        return obj.congressional_district.name if obj.congressional_district else None

    @staticmethod
    def resolve_state_senate_district_name(obj: "Stakeholder") -> str | None:
        return obj.state_senate_district.name if obj.state_senate_district else None

    @staticmethod
    def resolve_state_house_district_name(obj: "Stakeholder") -> str | None:
        return obj.state_house_district.name if obj.state_house_district else None

    @staticmethod
    def resolve_congressional_district_abbrev(obj: "Stakeholder") -> str | None:
        return obj.congressional_district.abbrev if obj.congressional_district else None

    @staticmethod
    def resolve_state_senate_district_abbrev(obj: "Stakeholder") -> str | None:
        return obj.state_senate_district.abbrev if obj.state_senate_district else None

    @staticmethod
    def resolve_state_house_district_abbrev(obj: "Stakeholder") -> str | None:
        return obj.state_house_district.abbrev if obj.state_house_district else None


class EndorsementOut(ModelSchema):
    """Response schema for Endorsement model with nested data."""

    stakeholder: StakeholderOut
    campaign: PolicyCampaignOut

    class Meta:
        model = Endorsement
        exclude = [
            "verification_token",
            "verification_sent_at",
            "admin_notes",
            "display_publicly",  # Redundant for public API - only show approved
        ]


class BillOut(Schema):
    """Response schema for Bill model."""

    class Meta:
        model = Bill
        fields = "__all__"


class LegislatorOut(ModelSchema):
    """Response schema for Legislator model."""

    class Meta:
        model = Legislator
        fields = "__all__"


class ContentBlockOut(ModelSchema):
    """Response schema for ContentBlock model with computed image properties."""

    # Add the computed property fields
    image_url: str
    image_alt_text: str
    image_title: str
    image_author: str
    image_license: str
    image_source_url: str
    image_caption: str
    image_caption_display: str

    class Meta:
        model = ContentBlock
        fields = "__all__"


class ThemeOut(ModelSchema):
    """Response schema for Theme model with computed URL fields."""

    # Add computed property fields
    logo_url: str | None = None
    favicon_url: str | None = None
    # Override datetime fields to return strings
    created_at: str
    updated_at: str

    class Meta:
        model = Theme
        fields = "__all__"

    @staticmethod
    def resolve_logo_url(obj: "Theme") -> str | None:
        """Get the logo URL"""
        return obj.logo_url

    @staticmethod
    def resolve_favicon_url(obj: "Theme") -> str | None:
        """Get the favicon URL"""
        return obj.favicon_url

    @staticmethod
    def resolve_created_at(obj: "Theme") -> str:
        """Convert created_at datetime to ISO string"""
        return obj.created_at.isoformat()

    @staticmethod
    def resolve_updated_at(obj: "Theme") -> str:
        """Convert updated_at datetime to ISO string"""
        return obj.updated_at.isoformat()


class VideoOut(ModelSchema):
    """Response schema for Video model with computed URL field."""

    # Add computed property field
    video_url: str

    class Meta:
        model = Video
        fields = "__all__"

    @staticmethod
    def resolve_video_url(obj: "Video") -> str:
        """Get the video URL"""
        return obj.video_url


class HomePageOut(ModelSchema):
    """Response schema for HomePage model with computed fields."""

    # Add computed property fields
    hero_background_image_url: str
    hero_background_video_url: str | None = None
    hero_background_video_data: VideoOut | None = None
    theme: ThemeOut | None = None

    class Meta:
        model = HomePage
        fields = "__all__"

    @staticmethod
    def resolve_hero_background_image_url(obj: "HomePage") -> str:
        """Get the hero background image URL"""
        return obj.hero_background_image_url

    @staticmethod
    def resolve_hero_background_video_url(obj: "HomePage") -> str | None:
        """Get the hero background video URL"""
        return obj.hero_background_video_url or None

    @staticmethod
    def resolve_hero_background_video_data(obj: "HomePage") -> "VideoOut | None":
        """Get the hero background video data"""
        return obj.hero_background_video if obj.hero_background_video else None

    @staticmethod
    def resolve_theme(obj: "HomePage") -> "ThemeOut | None":
        """Get the effective theme for this homepage"""
        theme = obj.get_theme()
        return theme if theme else None


# Spam prevention metadata schema with comprehensive validation
class SpamPreventionMetadata(Schema):
    """
    Structured schema for form metadata with security validation.

    Validates honeypot fields, timing data, and other spam prevention measures
    to prevent injection attacks and ensure data integrity.
    """

    # Honeypot fields - must be empty strings (bots often fill these)
    website: str = Field(
        default="",
        max_length=0,
        description="Honeypot field - must be empty",
    )
    url: str = Field(
        default="",
        max_length=0,
        description="Honeypot field - must be empty",
    )
    homepage: str = Field(
        default="",
        max_length=0,
        description="Honeypot field - must be empty",
    )
    confirm_email: str = Field(
        default="",
        max_length=0,
        description="Honeypot field - must be empty",
    )

    # Timing validation - ISO datetime string with size limits
    form_start_time: str = Field(
        default="",
        max_length=50,
        description="ISO datetime when form was first rendered",
    )

    # Additional security fields (optional, with size limits)
    referrer: str = Field(
        default="",
        max_length=500,
        description="Page referrer for analytics",
    )

    @validator("website", "url", "homepage", "confirm_email")
    def validate_honeypot_fields(cls, v: str) -> str:  # noqa: N805
        """Honeypot fields must be empty to prevent bot submissions."""
        if v and v.strip():
            raise ValueError("Honeypot field must be empty") from None
        return ""

    @validator("form_start_time")
    def validate_form_timing(cls, v: str) -> str:  # noqa: N805
        """Validate form timing data format and content."""
        if not v:
            return v

        # Sanitize input - remove dangerous characters
        v = str(v).strip()
        if len(v) > 50:
            raise ValueError("Form timing data too long") from None

        # Basic format validation (ISO datetime check)
        if v:
            try:
                datetime.fromisoformat(v.replace("Z", "+00:00"))
            except (ValueError, TypeError) as err:
                raise ValueError("Invalid datetime format for form_start_time") from err

        return v

    @validator("referrer")
    def validate_referrer(cls, v: str) -> str:  # noqa: N805
        """Validate and sanitize referrer field."""
        if not v:
            return ""

        # Sanitize and limit size
        v = str(v).strip()[:500]

        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", '"', "'", "&", "\0", "\r", "\n"]
        for char in dangerous_chars:
            v = v.replace(char, "")

        return v


# Input schemas for creating endorsements
class StakeholderCreateSchema(Schema):
    """Input schema for creating stakeholder records with validation."""

    first_name: str = Field(max_length=100, description="First name")
    last_name: str = Field(max_length=100, description="Last name")
    organization: str = Field(
        default="",
        max_length=200,
        description="Organization name (optional)",
    )
    role: str = Field(default="", max_length=100, description="Role/title")
    email: str = Field(max_length=254, description="Email address")

    # Address fields (required)
    street_address: str = Field(
        max_length=255,
        description="Street address",
    )
    city: str = Field(max_length=100, description="City")
    state: str = Field(max_length=2, description="State abbreviation")
    zip_code: str = Field(max_length=10, description="ZIP code")
    county: str = Field(default="", max_length=100, description="County name")

    type: str = Field(max_length=50, description="Stakeholder type")
    email_updates: bool = Field(
        default=False,
        description="Opt-in for policy email updates",
    )

    @validator("state")
    def validate_state(cls, v: str) -> str:  # noqa: N805
        """Validate US state abbreviation"""
        return AddressValidator.validate_state(v)

    @validator("zip_code")
    def validate_zip_code(cls, v: str) -> str:  # noqa: N805
        """Validate ZIP code format"""
        return AddressValidator.validate_zip_code(v)

    @validator("street_address")
    def validate_street_address(cls, v: str) -> str:  # noqa: N805
        """Validate street address"""
        return AddressValidator.validate_street_address(v)

    @validator("city")
    def validate_city(cls, v: str) -> str:  # noqa: N805
        """Validate city name"""
        return AddressValidator.validate_city(v)


class EndorsementCreateSchema(Schema):
    """Input schema for creating endorsements with spam prevention."""

    campaign_id: int
    stakeholder: StakeholderCreateSchema
    statement: str = Field(
        default="",
        max_length=2000,
        description="Optional endorsement statement",
    )
    public_display: bool = True
    terms_accepted: bool = Field(
        description="Whether the user has accepted the terms of use",
    )
    org_authorized: bool = Field(
        default=False,
        description="Whether the stakeholder is authorized to endorse on behalf "
        "of their organization",
    )
    # Structured spam prevention fields with validation
    form_metadata: SpamPreventionMetadata = Field(
        description="Spam prevention metadata with validation",
    )

    # Organization authorization validation is done in the API endpoint
    # because we need to check the stakeholder data after deserialization


class EndorsementVerifySchema(Schema):
    """Input schema for verifying endorsements via email."""

    email: str
    campaign_id: int
