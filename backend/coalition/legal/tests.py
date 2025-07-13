from django.contrib.auth.models import User
from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder

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
