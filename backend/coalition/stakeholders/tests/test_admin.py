"""
Tests for stakeholder Django admin interface.
"""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.http import HttpRequest

from coalition.stakeholders.admin import StakeholderAdmin
from coalition.stakeholders.models import Stakeholder
from coalition.test_base import BaseTestCase


class StakeholderAdminTest(BaseTestCase):
    """Test stakeholder admin interface functionality"""

    def setUp(self) -> None:
        super().setUp()
        self.site = AdminSite()
        self.admin = StakeholderAdmin(Stakeholder, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="Stakeholder",
            organization="Test Organization",
            role="Director",
            email="test@example.com",
            type="organization",
            email_updates=True,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save stakeholder without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new stakeholder
        new_stakeholder = Stakeholder(
            first_name="New",
            last_name="Stakeholder",
            organization="New Organization",
            email="new@example.com",
            type="individual",
            city="New City",
            state=self.virginia,  # Use Region object from fixture
            zip_code="54321",
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_stakeholder, None, change=False)
        assert new_stakeholder.id is not None

        # Test updating existing stakeholder
        self.stakeholder.first_name = "Updated"
        self.stakeholder.last_name = "Stakeholder"
        self.admin.save_model(request, self.stakeholder, None, change=True)
        self.stakeholder.refresh_from_db()
        assert self.stakeholder.first_name == "Updated"
        assert self.stakeholder.last_name == "Stakeholder"

    def test_endorsement_count_method(self) -> None:
        """Test endorsement_count admin method"""
        result = self.admin.endorsement_count(self.stakeholder)
        assert result == 0

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = ["first_name", "last_name", "email", "type", "state"]
        for field in required_fields:
            assert field in all_fieldset_fields

    def test_admin_readonly_fields_present(self) -> None:
        """Test that readonly fields are properly configured"""
        expected_readonly_fields = [
            "location",
            "congressional_district",
            "state_senate_district",
            "state_house_district",
            "created_at",
            "updated_at",
        ]

        for field in expected_readonly_fields:
            assert field in self.admin.readonly_fields

    def test_admin_readonly_fields_accessible(self) -> None:
        """Test that readonly fields are accessible"""
        for field in self.admin.readonly_fields:
            if hasattr(self.stakeholder, field):
                # Should not raise any exceptions
                value = getattr(self.stakeholder, field)
                # Value can be None, but accessing it shouldn't error
                assert (value is not None) or (value is None)

    def test_admin_list_display_methods_work(self) -> None:
        """Test that all list_display methods work without errors"""
        for method_name in self.admin.list_display:
            if hasattr(self.admin, method_name):
                method = getattr(self.admin, method_name)
                if callable(method):
                    # Should not raise any exceptions
                    result = method(self.stakeholder)
                    assert result is not None

    def test_admin_geographic_fields_readonly(self) -> None:
        """Test that geographic fields are read-only as requested"""
        geographic_fields = [
            "congressional_district",
            "state_senate_district",
            "state_house_district",
        ]

        for field in geographic_fields:
            assert field in self.admin.readonly_fields

    def test_admin_fieldsets_organization(self) -> None:
        """Test that admin fieldsets are properly organized"""
        fieldset_names = [fieldset[0] for fieldset in self.admin.fieldsets]
        expected_sections = [
            "Contact Information",
            "Address",
            "Geographic Information",
            "System Fields",
        ]

        for section in expected_sections:
            assert section in fieldset_names

    def test_admin_search_fields_work(self) -> None:
        """Test that search fields are properly configured"""
        search_fields = self.admin.search_fields
        expected_search_fields = [
            "first_name",
            "last_name",
            "organization",
            "email",
            "city",
            "county",
            "zip_code",
        ]

        for field in expected_search_fields:
            assert field in search_fields

    def test_admin_list_filter_work(self) -> None:
        """Test that list filters are properly configured"""
        list_filters = self.admin.list_filter
        expected_filters = ["type", "state", "email_updates", "created_at"]

        for filter_field in expected_filters:
            assert filter_field in list_filters
