from django.contrib import admin
from django.contrib.auth.models import User
from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder

from .admin import TermsAcceptanceAdmin
from .models import LegalDocument, TermsAcceptance


class LegalDocumentModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass",
        )

    def test_create_legal_document(self) -> None:
        doc = LegalDocument.objects.create(
            document_type="terms",
            title="Test Terms",
            content="<p>Test content</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )
        assert doc.title == "Test Terms"
        assert doc.document_type == "terms"
        assert doc.is_active

    def test_get_active_document(self) -> None:
        LegalDocument.objects.create(
            document_type="terms",
            title="Old Terms",
            content="<p>Old content</p>",
            version="1.0",
            is_active=False,
            created_by=self.user,
        )
        active_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Active Terms",
            content="<p>Active content</p>",
            version="2.0",
            is_active=True,
            created_by=self.user,
        )

        result = LegalDocument.get_active_document("terms")
        assert result == active_doc

    def test_no_active_document(self) -> None:
        result = LegalDocument.get_active_document("terms")
        assert result is None


class TermsAcceptanceTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass",
        )
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            active=True,
        )
        self.stakeholder = Stakeholder.objects.create(
            name="Test User",
            organization="Test Org",
            email="test@example.com",
            state="CA",
            type="individual",
        )
        self.endorsement = Endorsement.objects.create(
            campaign=self.campaign,
            stakeholder=self.stakeholder,
            statement="Test statement",
            public_display=True,
            terms_accepted=True,
        )
        self.legal_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<p>Terms content</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )

    def test_create_terms_acceptance(self) -> None:
        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_doc,
            ip_address="192.168.1.1",
            user_agent="Test Browser",
        )

        assert acceptance.endorsement == self.endorsement
        assert acceptance.legal_document == self.legal_doc
        assert acceptance.ip_address == "192.168.1.1"
        assert acceptance.accepted_at is not None


class TermsAcceptanceAdminTest(TestCase):
    def setUp(self) -> None:
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass",
        )
        self.regular_user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass",
        )
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            active=True,
        )
        self.stakeholder = Stakeholder.objects.create(
            name="Test User",
            organization="Test Org",
            email="test@example.com",
            state="CA",
            type="individual",
        )
        self.endorsement = Endorsement.objects.create(
            campaign=self.campaign,
            stakeholder=self.stakeholder,
            statement="Test statement",
            public_display=True,
            terms_accepted=True,
        )
        self.legal_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<p>Terms content</p>",
            version="1.0",
            is_active=True,
            created_by=self.admin_user,
        )
        self.acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_doc,
            ip_address="192.168.1.1",
            user_agent="Test Browser",
        )
        self.admin_instance = TermsAcceptanceAdmin(TermsAcceptance, admin.site)

    def test_admin_cannot_add_terms_acceptance(self) -> None:
        request = type("MockRequest", (), {"user": self.admin_user})()
        assert not self.admin_instance.has_add_permission(request)

    def test_admin_cannot_change_terms_acceptance(self) -> None:
        request = type("MockRequest", (), {"user": self.admin_user})()
        assert not self.admin_instance.has_change_permission(request)
        assert not self.admin_instance.has_change_permission(request, self.acceptance)

    def test_admin_cannot_delete_terms_acceptance(self) -> None:
        request = type("MockRequest", (), {"user": self.admin_user})()
        assert not self.admin_instance.has_delete_permission(request)
        assert not self.admin_instance.has_delete_permission(request, self.acceptance)

    def test_regular_user_cannot_delete_terms_acceptance(self) -> None:
        request = type("MockRequest", (), {"user": self.regular_user})()
        assert not self.admin_instance.has_delete_permission(request)
        assert not self.admin_instance.has_delete_permission(request, self.acceptance)

    def test_terms_acceptance_is_immutable(self) -> None:
        """Verify that TermsAcceptance records cannot be modified or deleted."""
        request = type("MockRequest", (), {"user": self.admin_user})()

        # Verify all permissions are denied
        assert not self.admin_instance.has_add_permission(request)
        assert not self.admin_instance.has_change_permission(request, self.acceptance)
        assert not self.admin_instance.has_delete_permission(request, self.acceptance)
