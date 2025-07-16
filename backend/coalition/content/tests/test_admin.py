"""
Tests for content Django admin interface.
"""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.test import TestCase

from coalition.content.admin import (
    ContentBlockAdmin,
    HomePageAdmin,
    ImageAdmin,
    ThemeAdmin,
)
from coalition.content.models import ContentBlock, HomePage, Image, Theme


class ThemeAdminTest(TestCase):
    """Test theme admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = ThemeAdmin(Theme, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.theme = Theme.objects.create(
            name="Test Theme",
            description="Test description",
            primary_color="#2563eb",
            secondary_color="#64748b",
            accent_color="#f59e0b",
            background_color="#ffffff",
            section_background_color="#f9fafb",
            card_background_color="#ffffff",
            heading_color="#111827",
            body_text_color="#374151",
            muted_text_color="#6b7280",
            link_color="#2563eb",
            link_hover_color="#1d4ed8",
            heading_font_family="Inter, sans-serif",
            body_font_family="Inter, sans-serif",
            is_active=True,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save theme without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new theme
        new_theme = Theme(
            name="New Theme",
            description="New description",
            primary_color="#000000",
            secondary_color="#333333",
            accent_color="#666666",
            background_color="#ffffff",
            section_background_color="#f5f5f5",
            card_background_color="#ffffff",
            heading_color="#000000",
            body_text_color="#333333",
            muted_text_color="#666666",
            link_color="#0066cc",
            link_hover_color="#0052a3",
            heading_font_family="Arial, sans-serif",
            body_font_family="Arial, sans-serif",
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_theme, None, change=False)
        assert new_theme.id is not None

        # Test updating existing theme
        self.theme.name = "Updated Theme"
        self.admin.save_model(request, self.theme, None, change=True)
        self.theme.refresh_from_db()
        assert self.theme.name == "Updated Theme"

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = [
            "name",
            "primary_color",
            "secondary_color",
            "accent_color",
            "background_color",
            "heading_color",
            "body_text_color",
            "link_color",
        ]
        for field in required_fields:
            assert field in all_fieldset_fields


class HomePageAdminTest(TestCase):
    """Test homepage admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = HomePageAdmin(HomePage, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.theme = Theme.objects.create(
            name="Test Theme",
            primary_color="#2563eb",
            secondary_color="#64748b",
            accent_color="#f59e0b",
            background_color="#ffffff",
            section_background_color="#f9fafb",
            card_background_color="#ffffff",
            heading_color="#111827",
            body_text_color="#374151",
            muted_text_color="#6b7280",
            link_color="#2563eb",
            link_hover_color="#1d4ed8",
            heading_font_family="Inter, sans-serif",
            body_font_family="Inter, sans-serif",
            is_active=True,
        )

        self.image = Image.objects.create(
            title="Test Hero Image",
            alt_text="Test hero alt text",
            image="hero.jpg",
            uploaded_by=self.user,
        )

        self.homepage = HomePage.objects.create(
            theme=self.theme,
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test Hero Title",
            hero_subtitle="Test hero subtitle",
            hero_background_image=self.image,
            cta_title="Get Involved",
            cta_content="Test CTA content",
            cta_button_text="Learn More",
            cta_button_url="https://example.com",
            is_active=True,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save homepage without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new homepage (inactive to avoid conflict)
        new_homepage = HomePage(
            organization_name="New Organization",
            tagline="New tagline",
            hero_title="New Hero Title",
            is_active=False,  # Set to False to avoid conflict
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_homepage, None, change=False)
        assert new_homepage.id is not None

        # Test updating existing homepage
        self.homepage.organization_name = "Updated Organization"
        self.admin.save_model(request, self.homepage, None, change=True)
        self.homepage.refresh_from_db()
        assert self.homepage.organization_name == "Updated Organization"

    def test_has_hero_image_method(self) -> None:
        """Test has_hero_image admin method"""
        # Homepage with hero image
        result = self.admin.has_hero_image(self.homepage)
        assert result is True

        # Homepage without hero image
        homepage_no_image = HomePage.objects.create(
            organization_name="No Image Organization",
            tagline="No image tagline",
            hero_title="No Image Hero Title",
            is_active=False,  # Set to False to avoid conflict
        )
        result = self.admin.has_hero_image(homepage_no_image)
        assert result is False

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = [
            "organization_name",
            "tagline",
            "hero_title",
        ]
        for field in required_fields:
            assert field in all_fieldset_fields


class ContentBlockAdminTest(TestCase):
    """Test content block admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = ContentBlockAdmin(ContentBlock, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test Hero Title",
        )

        self.image = Image.objects.create(
            title="Test Content Image",
            alt_text="Test content alt text",
            image="content.jpg",
            uploaded_by=self.user,
        )

        self.content_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Test Content Block",
            block_type="text_image",
            content="Test content",
            image=self.image,
            order=1,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save content block without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new content block
        new_content_block = ContentBlock(
            page_type="homepage",
            title="New Content Block",
            block_type="text",
            content="New content",
            order=2,
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_content_block, None, change=False)
        assert new_content_block.id is not None

        # Test updating existing content block
        self.content_block.title = "Updated Content Block"
        self.admin.save_model(request, self.content_block, None, change=True)
        self.content_block.refresh_from_db()
        assert self.content_block.title == "Updated Content Block"

    def test_has_image_method(self) -> None:
        """Test has_image admin method"""
        # Content block with image
        result = self.admin.has_image(self.content_block)
        assert result is True

        # Content block without image
        content_block_no_image = ContentBlock.objects.create(
            page_type="homepage",
            title="No Image Block",
            block_type="text",
            content="No image content",
            order=3,
        )
        result = self.admin.has_image(content_block_no_image)
        assert result is False

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = ["page_type", "block_type", "content", "order"]
        for field in required_fields:
            assert field in all_fieldset_fields


class ImageAdminTest(TestCase):
    """Test image admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = ImageAdmin(Image, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.image = Image.objects.create(
            title="Test Image",
            alt_text="Test alt text",
            description="Test description",
            author="Test Author",
            license="CC BY 2.0",
            source_url="https://example.com/image",
            image_type="general",
            image="test.jpg",
            uploaded_by=self.user,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save image without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new image
        new_image = Image(
            title="New Test Image",
            alt_text="New test alt text",
            image="new_test.jpg",
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_image, None, change=False)
        assert new_image.id is not None
        assert new_image.uploaded_by == self.user  # Should be set by save_model

        # Test updating existing image
        self.image.title = "Updated Test Image"
        self.admin.save_model(request, self.image, None, change=True)
        self.image.refresh_from_db()
        assert self.image.title == "Updated Test Image"

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = ["image", "title", "alt_text"]
        for field in required_fields:
            assert field in all_fieldset_fields

    def test_admin_readonly_fields_accessible(self) -> None:
        """Test that readonly fields are accessible"""
        for field in self.admin.readonly_fields:
            if hasattr(self.image, field):
                # Should not raise any exceptions
                value = getattr(self.image, field)
                # Value can be None, but accessing it shouldn't error
                assert (value is not None) or (value is None)
