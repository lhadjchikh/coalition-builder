"""
Tests for organization authorization in endorsements.
"""

import json

from django.core.cache import cache
from django.test import Client, TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.endorsements.models import Endorsement
from coalition.stakeholders.models import Stakeholder


def get_valid_form_metadata() -> dict[str, str]:
    """Return valid form metadata for testing"""
    return {
        "timestamp": "2024-01-01T10:00:00Z",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "referrer": "https://example.com/campaign-page",
        "ip_address": "192.168.1.100",
        "session_id": "test-session-123",
    }


class OrgAuthorizationTest(TestCase):
    """Test organization authorization functionality"""

    def setUp(self) -> None:
        cache.clear()  # Clear rate limiting cache between tests
        self.client = Client()

        # Create test campaign
        self.campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="A test campaign",
            description="Test description",
            endorsement_statement="I support this campaign",
            allow_endorsements=True,
        )

    def test_individual_without_organization_succeeds(self) -> None:
        """Test that individuals can endorse without providing organization"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "John",
                "last_name": "Doe",
                "organization": "",  # No organization provided
                "email": "john@example.com",
                "street_address": "123 Main St",
                "city": "Baltimore",
                "state": "MD",
                "zip_code": "21201",
                "type": "individual",
            },
            "statement": "I personally support this campaign",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": False,  # Not needed without organization
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder was created without organization
        stakeholder = Stakeholder.objects.get(email="john@example.com")
        assert stakeholder.organization == ""
        assert stakeholder.type == "individual"

        # Verify endorsement was created
        endorsement = Endorsement.objects.get(stakeholder=stakeholder)
        assert not endorsement.org_authorized

    def test_organization_affiliation_without_authorization(self) -> None:
        """Test that users can show organization affiliation without authorization"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Jane",
                "last_name": "Smith",
                "organization": "Green Energy Corp",
                "role": "CEO",
                "email": "jane@greenenergy.com",
                "street_address": "456 Business Blvd",
                "city": "Richmond",
                "state": "VA",
                "zip_code": "23220",
                "type": "business",
            },
            "statement": "I personally support this initiative",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": False,  # Personal endorsement, just showing affiliation
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify the endorsement was created with org_authorized=False
        endorsement = Endorsement.objects.get(stakeholder__email="jane@greenenergy.com")
        assert endorsement.org_authorized is False
        assert endorsement.stakeholder.organization == "Green Energy Corp"

    def test_organization_endorsement_with_authorization_succeeds(self) -> None:
        """Test that authorized organization endorsements succeed"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Bob",
                "last_name": "Johnson",
                "organization": "Clean Water Alliance",
                "role": "Executive Director",
                "email": "bob@cleanwater.org",
                "street_address": "789 Nonprofit Way",
                "city": "Annapolis",
                "state": "MD",
                "zip_code": "21401",
                "type": "nonprofit",
            },
            "statement": "Our organization endorses this campaign",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": True,  # Properly authorized
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder was created with organization
        stakeholder = Stakeholder.objects.get(email="bob@cleanwater.org")
        assert stakeholder.organization == "Clean Water Alliance"
        assert stakeholder.role == "Executive Director"

        # Verify endorsement was created with authorization
        endorsement = Endorsement.objects.get(stakeholder=stakeholder)
        assert endorsement.org_authorized

    def test_farmer_without_organization_name_but_with_farm_type(self) -> None:
        """Test that farmers can endorse as business type without organization name"""
        endorsement_data = {
            "campaign_id": self.campaign.id,
            "stakeholder": {
                "first_name": "Mary",
                "last_name": "Farm",
                "organization": "",  # No formal organization name
                "email": "mary@farmexample.com",
                "street_address": "Rural Route 1",
                "city": "Westminster",
                "state": "MD",
                "zip_code": "21157",
                "type": "farmer",  # Farmer type without organization
            },
            "statement": "As a local farmer, I support this",
            "public_display": True,
            "terms_accepted": True,
            "org_authorized": False,  # Not needed without organization
            "form_metadata": get_valid_form_metadata(),
        }

        response = self.client.post(
            "/api/endorsements/",
            data=json.dumps(endorsement_data),
            content_type="application/json",
        )

        assert response.status_code == 200

        # Verify stakeholder was created
        stakeholder = Stakeholder.objects.get(email="mary@farmexample.com")
        assert stakeholder.organization == ""
        assert stakeholder.type == "farmer"
