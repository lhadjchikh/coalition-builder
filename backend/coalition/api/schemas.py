from datetime import datetime
from typing import TYPE_CHECKING

from ninja import ModelSchema, Schema
from pydantic import Field, validator

from coalition.stakeholders.validators import AddressValidator

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from coalition.core.models import ContentBlock, HomePage

# Import models for ModelSchema
from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder


class PolicyCampaignOut(ModelSchema):
    class Meta:
        model = PolicyCampaign
        fields = [
            "id",
            "name",
            "title",
            "summary",
            "description",
            "endorsement_statement",
            "allow_endorsements",
            "endorsement_form_instructions",
            "active",
            "created_at",
        ]


class StakeholderOut(ModelSchema):
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
        fields = [
            "id",
            "name",
            "organization",
            "role",
            "email",
            "street_address",
            "city",
            "state",
            "zip_code",
            "county",
            "type",
            "created_at",
            "updated_at",
        ]

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
    stakeholder: StakeholderOut
    campaign: PolicyCampaignOut

    class Meta:
        model = Endorsement
        fields = [
            "id",
            "statement",
            "public_display",
            "status",
            "email_verified",
            "created_at",
            "verified_at",
            "reviewed_at",
        ]


class BillOut(Schema):
    id: int
    level: str = "federal"
    policy_id: int
    number: str
    title: str
    chamber: str
    session: str
    state_id: int | None = None
    state_name: str | None = None
    introduced_date: str
    status: str = ""
    url: str = ""
    is_primary: bool = False
    related_bill_id: int | None = None
    sponsors: list[int] = []
    cosponsors: list[int] = []
    display_name: str


class LegislatorOut(Schema):
    id: int
    level: str = "federal"
    bioguide_id: str | None = None
    state_id: str = ""
    first_name: str
    last_name: str
    chamber: str
    state: str
    district: str | None = None
    is_senior: bool | None = None
    party: str
    in_office: bool = True
    url: str = ""


class ContentBlockOut(Schema):
    id: int
    title: str
    block_type: str
    content: str
    image_url: str
    image_alt_text: str
    image_title: str
    image_author: str
    image_license: str
    image_source_url: str
    css_classes: str
    background_color: str
    order: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime


class ThemeOut(Schema):
    """Response schema for Theme model"""

    id: int
    name: str
    description: str | None = None

    # Brand colors
    primary_color: str
    secondary_color: str
    accent_color: str

    # Background colors
    background_color: str
    section_background_color: str
    card_background_color: str

    # Text colors
    heading_color: str
    body_text_color: str
    muted_text_color: str
    link_color: str
    link_hover_color: str

    # Typography
    heading_font_family: str
    body_font_family: str
    google_fonts: list[str]
    font_size_base: float
    font_size_small: float
    font_size_large: float

    # Brand assets
    logo_url: str | None = None
    logo_alt_text: str | None = None
    favicon_url: str | None = None

    # Custom CSS
    custom_css: str | None = None

    # Status
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HomePageOut(Schema):
    id: int
    # Organization info
    organization_name: str
    tagline: str

    # Hero section
    hero_title: str
    hero_subtitle: str
    hero_background_image: str

    # Main content sections
    about_section_title: str
    about_section_content: str

    # Call to action
    cta_title: str
    cta_content: str
    cta_button_text: str
    cta_button_url: str

    # Contact information
    contact_email: str
    contact_phone: str

    # Social media
    facebook_url: str
    twitter_url: str
    instagram_url: str
    linkedin_url: str

    # Campaign section customization
    campaigns_section_title: str
    campaigns_section_subtitle: str
    show_campaigns_section: bool

    # Content blocks
    content_blocks: list[ContentBlockOut]

    # Theme information
    theme: ThemeOut | None = None

    # Meta information
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_content_blocks(obj: "HomePage") -> "QuerySet[ContentBlock]":
        """Only return visible content blocks, ordered by order field"""
        return obj.content_blocks.filter(is_visible=True).order_by("order")

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
                from datetime import datetime

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
    name: str = Field(max_length=200, description="Stakeholder full name")
    organization: str = Field(max_length=200, description="Organization name")
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
    campaign_id: int
    stakeholder: StakeholderCreateSchema
    statement: str = Field(
        default="",
        max_length=2000,
        description="Optional endorsement statement",
    )
    public_display: bool = True
    # Structured spam prevention fields with validation
    form_metadata: SpamPreventionMetadata = Field(
        description="Spam prevention metadata with validation",
    )


class EndorsementVerifySchema(Schema):
    email: str
    campaign_id: int
