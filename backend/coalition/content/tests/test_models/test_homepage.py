from django.core.exceptions import ValidationError
from django.test import TestCase

from coalition.content.models import HomePage


class HomePageModelTest(TestCase):
    def setUp(self) -> None:
        self.homepage_data = {
            "organization_name": "Test Organization",
            "tagline": "Test tagline for organization",
            "hero_title": "Welcome to Test Organization",
            "hero_subtitle": "Making a difference in our community",
            "cta_title": "Join Us",
            "cta_content": "Get involved with our mission",
            "cta_button_text": "Learn More",
        }

    def test_create_homepage(self) -> None:
        """Test creating a homepage with valid data"""
        homepage = HomePage.objects.create(**self.homepage_data)
        assert homepage.organization_name == "Test Organization"
        assert homepage.tagline == "Test tagline for organization"
        assert homepage.hero_title == "Welcome to Test Organization"
        assert homepage.hero_subtitle == "Making a difference in our community"
        assert homepage.is_active
        assert homepage.created_at is not None
        assert homepage.updated_at is not None

    def test_homepage_str_representation(self) -> None:
        """Test string representation of homepage"""
        homepage = HomePage.objects.create(**self.homepage_data)
        expected_str = "Homepage: Test Organization"
        assert str(homepage) == expected_str

    def test_default_values(self) -> None:
        """Test that default values are set correctly"""
        minimal_data = {
            "organization_name": "Minimal Org",
            "tagline": "Minimal tagline",
            "hero_title": "Minimal Hero",
        }
        homepage = HomePage.objects.create(**minimal_data)

        assert homepage.cta_title == "Get Involved"
        assert homepage.cta_button_text == "Learn More"
        assert homepage.campaigns_section_title == "Policy Campaigns"
        assert homepage.show_campaigns_section
        assert homepage.is_active

    def test_single_active_homepage_constraint(self) -> None:
        """Test that only one homepage can be active at a time"""
        # Create first active homepage
        homepage1 = HomePage.objects.create(**self.homepage_data)
        assert homepage1.is_active

        # Create second homepage - should also be active initially
        data2 = self.homepage_data.copy()
        data2["organization_name"] = "Second Organization"

        # This should raise a ValidationError due to clean() method
        with self.assertRaises(ValidationError):
            homepage2 = HomePage(**data2)
            homepage2.save()

    def test_get_active_classmethod(self) -> None:
        """Test the get_active classmethod"""
        # No active homepage initially
        assert HomePage.get_active() is None

        # Create an active homepage
        homepage = HomePage.objects.create(**self.homepage_data)
        active_homepage = HomePage.get_active()
        assert active_homepage == homepage

    def test_get_active_multiple_active_returns_most_recent(self) -> None:
        """Test that get_active returns most recent when multiple exist"""
        # Create first homepage
        HomePage.objects.create(**self.homepage_data)

        # Create second homepage bypassing validation using bulk_create
        data2 = self.homepage_data.copy()
        data2["organization_name"] = "Second Organization"

        HomePage.objects.bulk_create([HomePage(**data2)])
        homepage2 = HomePage.objects.filter(
            organization_name="Second Organization",
        ).first()

        # Both should be active, get_active should return the most recent
        active_homepage = HomePage.get_active()
        assert active_homepage == homepage2

    def test_social_url_validation(self) -> None:
        """Test social media URL field validation"""
        invalid_data = self.homepage_data.copy()
        invalid_data["facebook_url"] = "not-a-valid-url"

        homepage = HomePage(**invalid_data)
        with self.assertRaises(ValidationError):
            homepage.full_clean()

    def test_optional_fields(self) -> None:
        """Test that optional fields can be blank"""
        minimal_data = {
            "organization_name": "Minimal Org",
            "tagline": "Minimal tagline",
            "hero_title": "Minimal Hero",
        }
        homepage = HomePage.objects.create(**minimal_data)

        # These should be blank/empty
        assert homepage.hero_subtitle == ""
        assert not homepage.hero_background_image
        assert homepage.facebook_url == ""
        assert homepage.twitter_url == ""
        assert homepage.instagram_url == ""
        assert homepage.linkedin_url == ""
        assert homepage.cta_content == ""
        assert homepage.cta_button_url == ""
        assert homepage.campaigns_section_subtitle == ""

    def test_hero_overlay_defaults(self) -> None:
        """Test that hero overlay fields have correct default values"""
        homepage = HomePage.objects.create(**self.homepage_data)

        assert homepage.hero_overlay_enabled is True
        assert homepage.hero_overlay_color == "#000000"
        assert homepage.hero_overlay_opacity == 0.4

    def test_hero_overlay_color_validation(self) -> None:
        """Test hero overlay color hex validation"""
        invalid_data = self.homepage_data.copy()
        invalid_data["hero_overlay_color"] = "not-a-hex-color"

        homepage = HomePage(**invalid_data)
        with self.assertRaises(ValidationError) as cm:
            homepage.full_clean()

        # Check that the error is about hero_overlay_color
        assert "hero_overlay_color" in str(cm.exception)

    def test_hero_overlay_opacity_validation(self) -> None:
        """Test hero overlay opacity range validation"""
        # Test opacity too high
        invalid_data = self.homepage_data.copy()
        invalid_data["hero_overlay_opacity"] = 1.5

        homepage = HomePage(**invalid_data)
        with self.assertRaises(ValidationError):
            homepage.full_clean()

        # Test opacity too low
        invalid_data["hero_overlay_opacity"] = -0.1
        homepage = HomePage(**invalid_data)
        with self.assertRaises(ValidationError):
            homepage.full_clean()

        # Test valid opacity
        valid_data = self.homepage_data.copy()
        valid_data["hero_overlay_opacity"] = 0.7
        homepage = HomePage(**valid_data)
        homepage.full_clean()  # Should not raise
