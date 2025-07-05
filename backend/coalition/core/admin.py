from typing import TYPE_CHECKING

from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms import ModelForm, TextInput
from django.utils.html import format_html

from .models import ContentBlock, HomePage, Theme

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from django.http import HttpRequest


class ContentBlockInline(admin.TabularInline):
    """Inline admin for content blocks within HomePage admin"""

    model = ContentBlock
    extra = 0
    fields = ("title", "block_type", "content", "image_url", "order", "is_visible")
    ordering = ("order",)


class HomePageForm(ModelForm):
    """Custom form for HomePage admin with validation"""

    class Meta:
        model = HomePage
        fields = "__all__"

    def clean(self) -> dict:
        """Delegate validation to the model's clean method"""
        cleaned_data = super().clean()

        # Apply cleaned data to the instance for validation
        for field, value in cleaned_data.items():
            setattr(self.instance, field, value)

        # Call the model's clean method to centralize validation logic
        try:
            self.instance.clean()
        except ValidationError as e:
            # Convert model ValidationError to form ValidationError
            if hasattr(e, "message_dict") and e.message_dict:
                for field, messages in e.message_dict.items():
                    self.add_error(field, messages)
            else:
                # Non-field errors
                for message in e.messages:
                    self.add_error(None, message)

        return cleaned_data


@admin.register(HomePage)
class HomePageAdmin(admin.ModelAdmin):
    """Admin interface for HomePage model"""

    form = HomePageForm
    inlines = [ContentBlockInline]

    list_display = (
        "organization_name",
        "hero_title",
        "is_active",
        "updated_at",
        "created_at",
    )

    list_filter = ("is_active", "created_at", "updated_at")

    search_fields = ("organization_name", "hero_title", "tagline")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Organization Information",
            {
                "fields": (
                    "organization_name",
                    "tagline",
                    "contact_email",
                    "contact_phone",
                ),
            },
        ),
        (
            "Hero Section",
            {
                "fields": ("hero_title", "hero_subtitle", "hero_background_image"),
                "description": "Main banner section at the top of the homepage",
            },
        ),
        (
            "About Section",
            {
                "fields": ("about_section_title", "about_section_content"),
                "description": "Mission and organizational information section",
            },
        ),
        (
            "Call to Action",
            {
                "fields": (
                    "cta_title",
                    "cta_content",
                    "cta_button_text",
                    "cta_button_url",
                ),
                "description": "Primary call-to-action section",
            },
        ),
        (
            "Social Media",
            {
                "fields": (
                    "facebook_url",
                    "twitter_url",
                    "instagram_url",
                    "linkedin_url",
                ),
                "classes": ("collapse",),
                "description": "Social media profile links",
            },
        ),
        (
            "Campaigns Section",
            {
                "fields": (
                    "campaigns_section_title",
                    "campaigns_section_subtitle",
                    "show_campaigns_section",
                ),
                "description": "Configuration for the policy campaigns display section",
            },
        ),
        (
            "Settings",
            {
                "fields": ("is_active", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_queryset(self, request: "HttpRequest") -> "QuerySet[HomePage]":
        """Order by most recently updated first"""
        return super().get_queryset(request).order_by("-updated_at")


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    """Admin interface for ContentBlock model"""

    list_display = (
        "title",
        "block_type",
        "homepage",
        "order",
        "is_visible",
        "updated_at",
    )

    list_filter = ("block_type", "is_visible", "homepage", "created_at")

    search_fields = ("title", "content")

    list_editable = ("order", "is_visible")

    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Content", {"fields": ("homepage", "title", "block_type", "content")}),
        (
            "Media",
            {
                "fields": ("image_url", "image_alt_text"),
                "classes": ("collapse",),
                "description": "Image settings for image-based content blocks",
            },
        ),
        (
            "Styling",
            {
                "fields": ("css_classes", "background_color"),
                "classes": ("collapse",),
                "description": "Optional styling customizations",
            },
        ),
        ("Display", {"fields": ("order", "is_visible", "created_at", "updated_at")}),
    )

    def get_queryset(self, request: "HttpRequest") -> "QuerySet[ContentBlock]":
        """Order by homepage and then by order"""
        return super().get_queryset(request).order_by("homepage", "order")


class ThemeForm(ModelForm):
    """Custom form for Theme admin with color picker widgets"""

    class Meta:
        model = Theme
        fields = "__all__"
        widgets = {
            # Color fields with HTML5 color picker
            "primary_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "secondary_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "accent_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "background_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "section_background_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "card_background_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "heading_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "body_text_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "muted_text_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "link_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
            "link_hover_color": TextInput(
                attrs={"type": "color", "style": "width: 60px; height: 40px;"},
            ),
        }

    def clean(self) -> dict:
        """Delegate validation to the model's clean method"""
        cleaned_data = super().clean()

        # Apply cleaned data to the instance for validation
        for field, value in cleaned_data.items():
            setattr(self.instance, field, value)

        # Call the model's clean method to centralize validation logic
        try:
            self.instance.clean()
        except ValidationError as e:
            # Convert model ValidationError to form ValidationError
            if hasattr(e, "message_dict") and e.message_dict:
                for field, messages in e.message_dict.items():
                    self.add_error(field, messages)
            else:
                # Non-field errors
                for message in e.messages:
                    self.add_error(None, message)

        return cleaned_data


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    """Admin interface for Theme model with color picker support"""

    form = ThemeForm

    list_display = (
        "name",
        "color_preview",
        "is_active",
        "updated_at",
        "created_at",
    )

    list_filter = ("is_active", "created_at", "updated_at")

    search_fields = ("name", "description")

    readonly_fields = ("created_at", "updated_at", "css_preview")

    actions = ["activate_theme", "deactivate_theme"]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("name", "description", "is_active"),
            },
        ),
        (
            "Brand Colors",
            {
                "fields": ("primary_color", "secondary_color", "accent_color"),
                "description": "Main brand colors for buttons, links, and highlights",
            },
        ),
        (
            "Background Colors",
            {
                "fields": (
                    "background_color",
                    "section_background_color",
                    "card_background_color",
                ),
                "description": "Background colors for different page sections",
            },
        ),
        (
            "Text Colors",
            {
                "fields": (
                    "heading_color",
                    "body_text_color",
                    "muted_text_color",
                    "link_color",
                    "link_hover_color",
                ),
                "description": "Colors for text elements and links",
            },
        ),
        (
            "Typography",
            {
                "fields": (
                    "heading_font_family",
                    "body_font_family",
                    "google_fonts",
                    "font_size_base",
                    "font_size_small",
                    "font_size_large",
                ),
                "classes": ("collapse",),
                "description": "Font families and sizes",
            },
        ),
        (
            "Brand Assets",
            {
                "fields": ("logo_url", "logo_alt_text", "favicon_url"),
                "classes": ("collapse",),
                "description": "Logo and branding images",
            },
        ),
        (
            "Advanced",
            {
                "fields": ("custom_css", "css_preview"),
                "classes": ("collapse",),
                "description": "Custom CSS for advanced styling",
            },
        ),
        (
            "Meta Information",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def color_preview(self, obj: Theme) -> str:
        """Display a preview of the theme's primary colors"""
        return format_html(
            '<div style="display: flex; gap: 4px;">'
            '<div style="width: 20px; height: 20px; background-color: {}; '
            'border: 1px solid #ccc; border-radius: 3px;"></div>'
            '<div style="width: 20px; height: 20px; background-color: {}; '
            'border: 1px solid #ccc; border-radius: 3px;"></div>'
            '<div style="width: 20px; height: 20px; background-color: {}; '
            'border: 1px solid #ccc; border-radius: 3px;"></div>'
            "</div>",
            obj.primary_color,
            obj.secondary_color,
            obj.accent_color,
        )

    color_preview.short_description = "Color Preview"

    def css_preview(self, obj: Theme) -> str:
        """Display a preview of the generated CSS variables"""
        if obj.pk:
            css_vars = obj.generate_css_variables()
            return format_html(
                '<pre style="background: #f8f9fa; padding: 10px; '
                "border-radius: 4px; font-size: 12px; max-height: 200px; "
                'overflow-y: auto;">{}</pre>',
                css_vars,
            )
        return "Save the theme to see CSS preview"

    css_preview.short_description = "Generated CSS Variables"

    def activate_theme(
        self,
        request: "HttpRequest",
        queryset: "QuerySet[Theme]",
    ) -> None:
        """Admin action to activate selected themes"""
        if queryset.count() > 1:
            self.message_user(
                request,
                "You can only activate one theme at a time.",
                level=admin.ERROR,
            )
            return

        # Deactivate all themes first
        Theme.objects.filter(is_active=True).update(is_active=False)

        # Activate the selected theme
        theme = queryset.first()
        theme.is_active = True
        theme.save()

        self.message_user(
            request,
            f'Theme "{theme.name}" has been activated.',
            level=admin.SUCCESS,
        )

    activate_theme.short_description = "Activate selected theme"

    def deactivate_theme(
        self,
        request: "HttpRequest",
        queryset: "QuerySet[Theme]",
    ) -> None:
        """Admin action to deactivate selected themes"""
        count = queryset.update(is_active=False)
        self.message_user(
            request,
            f"{count} theme(s) have been deactivated.",
            level=admin.SUCCESS,
        )

    deactivate_theme.short_description = "Deactivate selected themes"

    def get_queryset(self, request: "HttpRequest") -> "QuerySet[Theme]":
        """Order by active status and then by most recently updated"""
        return super().get_queryset(request).order_by("-is_active", "-updated_at")
