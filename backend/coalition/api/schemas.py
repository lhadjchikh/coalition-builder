from datetime import datetime
from typing import TYPE_CHECKING

from ninja import ModelSchema, Schema
from pydantic import Field, validator

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
    class Meta:
        model = Stakeholder
        fields = [
            "id",
            "name",
            "organization",
            "role",
            "email",
            "state",
            "county",
            "type",
            "created_at",
            "updated_at",
        ]


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


class LegislatorOut(Schema):
    id: int
    first_name: str
    last_name: str
    chamber: str
    state: str
    district: str | None = None
    is_senior: bool | None = None


class ContentBlockOut(Schema):
    id: int
    title: str
    block_type: str
    content: str
    image_url: str
    image_alt_text: str
    css_classes: str
    background_color: str
    order: int
    is_visible: bool
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

    # Meta information
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def resolve_content_blocks(obj: "HomePage") -> "QuerySet[ContentBlock]":
        """Only return visible content blocks, ordered by order field"""
        return obj.content_blocks.filter(is_visible=True).order_by("order")


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
    email: str = Field(max_length=100, description="Email address")
    state: str = Field(max_length=5, description="State abbreviation")
    county: str = Field(default="", max_length=100, description="County name")
    type: str = Field(max_length=50, description="Stakeholder type")


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
