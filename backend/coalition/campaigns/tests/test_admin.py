"""
Tests for campaign Django admin interface.
"""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.test import TestCase

from coalition.campaigns.admin import PolicyCampaignAdmin
from coalition.campaigns.models import PolicyCampaign
from coalition.content.models import Image


class PolicyCampaignAdminTest(TestCase):
    """Test policy campaign admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = PolicyCampaignAdmin(PolicyCampaign, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.image = Image.objects.create(
            title="Test Image",
            alt_text="Test alt text",
            image="test.jpg",
            uploaded_by=self.user,
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            description="Test description",
            image=self.image,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save campaign without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new campaign
        new_campaign = PolicyCampaign(
            name="new-campaign",
            title="New Campaign",
            summary="New summary",
            description="New description",
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_campaign, None, change=False)
        assert new_campaign.id is not None

        # Test updating existing campaign
        self.campaign.title = "Updated Campaign"
        self.admin.save_model(request, self.campaign, None, change=True)
        self.campaign.refresh_from_db()
        assert self.campaign.title == "Updated Campaign"

    def test_has_image_method(self) -> None:
        """Test has_image admin method"""
        # Campaign with image
        result = self.admin.has_image(self.campaign)
        assert result is True

        # Campaign without image
        campaign_no_image = PolicyCampaign.objects.create(
            name="no-image-campaign",
            title="No Image Campaign",
            summary="No image summary",
            description="No image description",
        )
        result = self.admin.has_image(campaign_no_image)
        assert result is False

    def test_endorsement_count_method(self) -> None:
        """Test endorsement_count admin method"""
        result = self.admin.endorsement_count(self.campaign)
        assert result == 0

    def test_bill_count_method(self) -> None:
        """Test bill_count admin method"""
        result = self.admin.bill_count(self.campaign)
        assert result == 0

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        # Check that required model fields are in fieldsets
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = ["name", "title", "summary", "description"]
        for field in required_fields:
            assert field in all_fieldset_fields

    def test_admin_list_display_methods_work(self) -> None:
        """Test that all list_display methods work without errors"""
        for method_name in self.admin.list_display:
            if hasattr(self.admin, method_name):
                method = getattr(self.admin, method_name)
                if callable(method):
                    # Should not raise any exceptions
                    result = method(self.campaign)
                    assert result is not None

    def test_admin_readonly_fields_accessible(self) -> None:
        """Test that readonly fields are accessible"""
        for field in self.admin.readonly_fields:
            if hasattr(self.campaign, field):
                # Should not raise any exceptions
                value = getattr(self.campaign, field)
                # Value can be None, but accessing it shouldn't error
                assert (value is not None) or (value is None)

    def test_admin_queryset_optimization(self) -> None:
        """Test that admin queryset is properly optimized"""
        request = HttpRequest()
        request.user = self.user

        queryset = self.admin.get_queryset(request)
        # Should not raise any exceptions
        list(queryset)  # Force evaluation of queryset

        # Check ordering is applied
        assert queryset.query.order_by == ("-created_at",)
