"""
Tests for legal models.
"""

import uuid

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.utils import timezone

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.legal.models import LegalDocument, TermsAcceptance
from coalition.stakeholders.models import Stakeholder
from coalition.test_base import BaseTestCase


class LegalDocumentTest(BaseTestCase):
    """Test LegalDocument model functionality"""

    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass",
        )

    def test_create_legal_document(self) -> None:
        """Test creating a legal document"""
        doc = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<h1>Terms of Use</h1><p>These are the terms.</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )

        assert doc.document_type == "terms"
        assert doc.title == "Terms of Use"
        assert doc.version == "1.0"
        assert doc.is_active is True
        assert doc.created_by == self.user
        assert doc.created_at is not None
        assert doc.updated_at is not None

    def test_str_representation(self) -> None:
        """Test string representation of legal document"""
        doc = LegalDocument.objects.create(
            document_type="privacy",
            title="Privacy Policy",
            content="<p>Privacy content</p>",
            version="2.1",
            is_active=True,
        )

        assert str(doc) == "Privacy Policy v2.1 (ACTIVE)"

        doc.is_active = False
        doc.save()
        assert str(doc) == "Privacy Policy v2.1"

    def test_unique_together_constraint(self) -> None:
        """Test that document_type and version must be unique together"""
        LegalDocument.objects.create(
            document_type="terms",
            title="Terms v1",
            content="<p>Content</p>",
            version="1.0",
        )

        # Should raise IntegrityError for duplicate document_type + version
        with self.assertRaises(IntegrityError):
            LegalDocument.objects.create(
                document_type="terms",
                title="Terms v1 duplicate",
                content="<p>Different content</p>",
                version="1.0",
            )

    def test_only_one_active_document_per_type(self) -> None:
        """Test that only one document of each type can be active"""
        # Create first active document
        doc1 = LegalDocument.objects.create(
            document_type="terms",
            title="Terms v1",
            content="<p>Content v1</p>",
            version="1.0",
            is_active=True,
        )

        # Create second active document of same type
        doc2 = LegalDocument.objects.create(
            document_type="terms",
            title="Terms v2",
            content="<p>Content v2</p>",
            version="2.0",
            is_active=True,
        )

        # First document should be deactivated
        doc1.refresh_from_db()
        assert doc1.is_active is False
        assert doc2.is_active is True

    def test_get_active_document(self) -> None:
        """Test getting active document by type"""
        # No active document initially
        assert LegalDocument.get_active_document("terms") is None

        # Create inactive document
        LegalDocument.objects.create(
            document_type="terms",
            title="Inactive Terms",
            content="<p>Inactive content</p>",
            version="1.0",
            is_active=False,
        )

        # Should still be None
        assert LegalDocument.get_active_document("terms") is None

        # Create active document
        active_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Active Terms",
            content="<p>Active content</p>",
            version="2.0",
            is_active=True,
        )

        # Should return active document
        result = LegalDocument.get_active_document("terms")
        assert result == active_doc

    def test_html_sanitization_on_save(self) -> None:
        """Test that HTML content is sanitized on save"""
        doc = LegalDocument.objects.create(
            document_type="terms",
            title="<script>alert('xss')</script>Clean Title",
            content="<p>Safe content</p><script>alert('xss')</script>",
            version="1.0",
        )

        # Title should be sanitized (plain text)
        assert "<script>" not in doc.title
        assert "Clean Title" in doc.title

        # Content should be sanitized but allow safe HTML
        assert "<script>" not in doc.content
        assert "<p>Safe content</p>" in doc.content

    def test_richtext_field_functionality(self) -> None:
        """Test that HTMLField works correctly"""
        rich_content = (
            "<h1>Legal Document</h1>"
            "<h2>Section 1</h2>"
            "<p>This is a <strong>legal</strong> document with <em>formatting</em>.</p>"
            "<ul><li>Item 1</li><li>Item 2</li></ul>"
            "<p>Contact us at "
            "<a href='mailto:legal@example.com'>legal@example.com</a></p>"
        )

        doc = LegalDocument.objects.create(
            document_type="terms",
            title="Rich Text Terms",
            content=rich_content,
            version="1.0",
        )

        # Content should be preserved with proper formatting
        assert "<h1>Legal Document</h1>" in doc.content
        assert "<strong>legal</strong>" in doc.content
        assert "<em>formatting</em>" in doc.content
        assert "<ul><li>Item 1</li><li>Item 2</li></ul>" in doc.content
        assert "legal@example.com" in doc.content

    def test_meta_configuration(self) -> None:
        """Test model meta configuration"""
        # Create multiple documents with different dates
        doc1 = LegalDocument.objects.create(
            document_type="terms",
            title="Terms 1",
            content="<p>Content 1</p>",
            version="1.0",
            effective_date=timezone.now() - timezone.timedelta(days=2),
        )

        doc2 = LegalDocument.objects.create(
            document_type="privacy",
            title="Privacy 1",
            content="<p>Content 2</p>",
            version="1.0",
            effective_date=timezone.now() - timezone.timedelta(days=1),
        )

        # Should be ordered by effective_date descending
        docs = list(LegalDocument.objects.all())
        assert docs[0] == doc2  # More recent
        assert docs[1] == doc1  # Older


class TermsAcceptanceTest(BaseTestCase):
    """Test TermsAcceptance model functionality"""

    def setUp(self) -> None:
        super().setUp()
        self.stakeholder = self.create_stakeholder(
            first_name="Test",
            last_name="Stakeholder",
            email="stakeholder@example.com",
            type="individual",
        )

        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
        )

        self.endorsement = Endorsement.objects.create(
            stakeholder=self.stakeholder,
            campaign=self.campaign,
            statement="Test endorsement",
        )

        self.legal_document = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<h1>Terms</h1><p>Test terms content</p>",
            version="1.0",
            is_active=True,
        )

    def test_create_terms_acceptance(self) -> None:
        """Test creating a terms acceptance record"""
        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0 (Test Browser)",
        )

        assert acceptance.endorsement == self.endorsement
        assert acceptance.legal_document == self.legal_document
        assert acceptance.ip_address == "192.168.1.1"
        assert acceptance.user_agent == "Mozilla/5.0 (Test Browser)"
        assert acceptance.accepted_at is not None
        assert isinstance(acceptance.acceptance_token, uuid.UUID)

    def test_str_representation(self) -> None:
        """Test string representation of terms acceptance"""
        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
        )

        str_repr = str(acceptance)
        assert "Test Stakeholder" in str_repr
        assert "Terms of Use v1.0" in str_repr
        assert "accepted" in str_repr

    def test_user_agent_truncation(self) -> None:
        """Test that user agent is truncated if too long"""
        long_user_agent = "A" * 1500  # Longer than 1000 chars

        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
            user_agent=long_user_agent,
        )

        # Should be truncated to 1000 chars
        assert len(acceptance.user_agent) == 1000
        assert acceptance.user_agent == "A" * 1000

    def test_acceptance_token_uniqueness(self) -> None:
        """Test that acceptance tokens are unique"""
        acceptance1 = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
        )

        # Create another stakeholder and campaign for second acceptance
        stakeholder2 = Stakeholder.objects.create(
            first_name="Test",
            last_name="Stakeholder 2",
            email="stakeholder2@example.com",
            type="individual",
            state="VA",
        )

        campaign2 = PolicyCampaign.objects.create(
            name="test-campaign-2",
            title="Test Campaign 2",
            summary="Test summary 2",
        )

        endorsement2 = Endorsement.objects.create(
            stakeholder=stakeholder2,
            campaign=campaign2,
            statement="Another endorsement",
        )

        acceptance2 = TermsAcceptance.objects.create(
            endorsement=endorsement2,
            legal_document=self.legal_document,
        )

        # Tokens should be different
        assert acceptance1.acceptance_token != acceptance2.acceptance_token

    def test_protect_on_legal_document_deletion(self) -> None:
        """Test that legal documents are protected from deletion when referenced"""
        TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
        )

        # Should not be able to delete legal document that has acceptances
        with self.assertRaises(ProtectedError):
            self.legal_document.delete()

    def test_cascade_on_endorsement_deletion(self) -> None:
        """Test that terms acceptance is deleted when endorsement is deleted"""
        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
        )

        acceptance_id = acceptance.id

        # Delete endorsement
        self.endorsement.delete()

        # Terms acceptance should be deleted too
        assert not TermsAcceptance.objects.filter(id=acceptance_id).exists()

    def test_optional_fields(self) -> None:
        """Test that IP address and user agent are optional"""
        acceptance = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
        )

        # Should work without IP address or user agent
        assert acceptance.ip_address is None
        assert acceptance.user_agent == ""

    def test_meta_configuration(self) -> None:
        """Test model meta configuration and ordering"""
        # Create multiple acceptances with different timestamps
        acceptance1 = TermsAcceptance.objects.create(
            endorsement=self.endorsement,
            legal_document=self.legal_document,
            accepted_at=timezone.now() - timezone.timedelta(hours=2),
        )

        # Create another stakeholder and campaign for second acceptance
        stakeholder2 = Stakeholder.objects.create(
            first_name="Test",
            last_name="Stakeholder 2",
            email="stakeholder2@example.com",
            type="individual",
            state="VA",
        )

        campaign2 = PolicyCampaign.objects.create(
            name="test-campaign-2",
            title="Test Campaign 2",
            summary="Test summary 2",
        )

        endorsement2 = Endorsement.objects.create(
            stakeholder=stakeholder2,
            campaign=campaign2,
            statement="Another endorsement",
        )

        acceptance2 = TermsAcceptance.objects.create(
            endorsement=endorsement2,
            legal_document=self.legal_document,
            accepted_at=timezone.now() - timezone.timedelta(hours=1),
        )

        # Should be ordered by accepted_at descending
        acceptances = list(TermsAcceptance.objects.all())
        assert acceptances[0] == acceptance2  # More recent
        assert acceptances[1] == acceptance1  # Older
