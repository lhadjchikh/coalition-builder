from django.contrib.auth.models import User
from django.test import TestCase

from coalition.legal.models import LegalDocument


class LegalAPITest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass",
        )
        self.terms_doc = LegalDocument.objects.create(
            document_type="terms",
            title="Terms of Use",
            content="<p>Terms content</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )

    def test_get_terms_endpoint(self) -> None:
        response = self.client.get("/api/legal/terms/")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Terms of Use"
        assert data["version"] == "1.0"
        assert "content" in data

    def test_get_terms_not_found(self) -> None:
        self.terms_doc.delete()
        response = self.client.get("/api/legal/terms/")

        assert response.status_code == 404
        data = response.json()
        assert "error" in data

    def test_get_privacy_endpoint(self) -> None:
        LegalDocument.objects.create(
            document_type="privacy",
            title="Privacy Policy",
            content="<p>Privacy content</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )

        response = self.client.get("/api/legal/privacy/")

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Privacy Policy"
        assert data["version"] == "1.0"
        assert "content" in data
        assert data["document_type"] == "privacy"

    def test_get_privacy_not_found(self) -> None:
        response = self.client.get("/api/legal/privacy/")

        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "Privacy Policy" in data["message"]

    def test_list_legal_documents(self) -> None:
        LegalDocument.objects.create(
            document_type="privacy",
            title="Privacy Policy",
            content="<p>Privacy content</p>",
            version="1.0",
            is_active=True,
            created_by=self.user,
        )

        response = self.client.get("/api/legal/documents/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # terms + privacy

        document_types = [doc["document_type"] for doc in data]
        assert "terms" in document_types
        assert "privacy" in document_types

        # Check document structure
        terms_doc = next(doc for doc in data if doc["document_type"] == "terms")
        assert "id" in terms_doc
        assert "title" in terms_doc
        assert "version" in terms_doc
        assert "effective_date" in terms_doc
        assert "document_type_display" in terms_doc

    def test_list_legal_documents_empty(self) -> None:
        # Delete all documents
        LegalDocument.objects.all().delete()

        response = self.client.get("/api/legal/documents/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
        assert data == []
