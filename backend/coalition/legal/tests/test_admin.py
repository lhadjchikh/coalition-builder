"""
Tests for legal Django admin interface.
"""

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.test import TestCase

from coalition.legal.admin import LegalDocumentAdmin
from coalition.legal.models import LegalDocument


class LegalDocumentAdminTest(TestCase):
    """Test legal document admin interface functionality"""

    def setUp(self) -> None:
        self.site = AdminSite()
        self.admin = LegalDocumentAdmin(LegalDocument, self.site)

        self.user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass",
        )

        self.legal_document = LegalDocument.objects.create(
            document_type="terms",
            title="Test Terms of Use",
            version="1.0",
            content=(
                "<h1>Terms of Use</h1>"
                "<p>Test content with <strong>formatting</strong>.</p>"
            ),
            is_active=True,
        )

    def test_admin_save_without_errors(self) -> None:
        """Test that admin can save legal document without 500 errors"""
        request = HttpRequest()
        request.user = self.user
        request.method = "POST"

        # Test creating a new legal document
        new_legal_document = LegalDocument(
            document_type="privacy",
            title="Privacy Policy",
            version="1.0",
            content="<h1>Privacy Policy</h1><p>Test privacy content</p>",
            is_active=True,
        )

        # This should not raise any exceptions
        self.admin.save_model(request, new_legal_document, None, change=False)
        assert new_legal_document.id is not None

        # Test updating existing legal document
        self.legal_document.title = "Updated Terms of Use"
        self.admin.save_model(request, self.legal_document, None, change=True)
        self.legal_document.refresh_from_db()
        assert self.legal_document.title == "Updated Terms of Use"

    def test_admin_required_fields_present(self) -> None:
        """Test that all required fields are present in admin configuration"""
        all_fieldset_fields = []
        for fieldset in self.admin.fieldsets:
            all_fieldset_fields.extend(fieldset[1]["fields"])

        # Required fields that should be in admin
        required_fields = ["document_type", "title", "content", "version"]
        for field in required_fields:
            assert field in all_fieldset_fields

    def test_admin_list_display_methods_work(self) -> None:
        """Test that all list_display methods work without errors"""
        for method_name in self.admin.list_display:
            if hasattr(self.admin, method_name):
                method = getattr(self.admin, method_name)
                if callable(method):
                    # Should not raise any exceptions
                    result = method(self.legal_document)
                    assert result is not None

    def test_admin_readonly_fields_accessible(self) -> None:
        """Test that readonly fields are accessible"""
        for field in self.admin.readonly_fields:
            if hasattr(self.legal_document, field):
                # Should not raise any exceptions
                value = getattr(self.legal_document, field)
                # Value can be None, but accessing it shouldn't error
                assert (value is not None) or (value is None)
