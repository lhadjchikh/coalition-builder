from unittest.mock import patch

from django.test import TestCase
from django.test.client import Client

from coalition.content.models import ContentBlock, HomePage, Image


class HomepageAPITest(TestCase):
    def setUp(self) -> None:
        # Use Django's test client
        self.client = Client()

        # Mock S3 URLs for image properties
        self.hero_bg_url = (
            "https://test-bucket.s3.amazonaws.com/backgrounds/hero-bg.jpg"
        )
        self.content_block_img_url = (
            "https://test-bucket.s3.amazonaws.com/content_blocks/test-image.jpg"
        )

        # Create test data
        self._setup_test_data()

        # Patch the properties at the class level so ALL instances return mock URLs
        self.homepage_patch = patch.object(
            HomePage,
            "hero_background_image_url",
            new_callable=lambda: property(
                lambda self: (
                    self.hero_bg_url
                    if hasattr(self, "hero_bg_url")
                    else "https://test-bucket.s3.amazonaws.com/backgrounds/hero-bg.jpg"
                ),
            ),
        )
        self.content_block_patch = patch.object(
            ContentBlock,
            "image_url",
            new_callable=lambda: property(
                lambda self: (
                    "https://test-bucket.s3.amazonaws.com/content_blocks/test-image.jpg"
                    if self.block_type == "image"
                    else ""
                ),
            ),
        )

        self.homepage_patch.start()
        self.content_block_patch.start()

    def tearDown(self) -> None:
        # Stop the patches
        self.homepage_patch.stop()
        self.content_block_patch.stop()

    def _setup_test_data(self) -> None:
        # Create test homepage
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Building test coalitions",
            hero_title="Welcome to Test Organization",
            hero_subtitle="Making a difference in testing",
            cta_title="Join Our Test",
            cta_content="Help us test this platform",
            cta_button_text="Get Started",
            cta_button_url="https://example.com/join",
            facebook_url="https://facebook.com/testorg",
            twitter_url="https://twitter.com/testorg",
            instagram_url="https://instagram.com/testorg",
            linkedin_url="https://linkedin.com/company/testorg",
            campaigns_section_title="Test Campaigns",
            campaigns_section_subtitle="Our current testing initiatives",
            show_campaigns_section=True,
            is_active=True,
        )

        # Create test content blocks
        self.content_block1 = ContentBlock.objects.create(
            page_type="homepage",
            title="Test Block 1",
            block_type="text",
            content="This is the first test content block.",
            order=1,
            is_visible=True,
        )

        # Create test image for content block
        self.test_image = Image.objects.create(
            title="Test Content Image",
            alt_text="Test image",
            image_type="content",
        )

        self.content_block2 = ContentBlock.objects.create(
            page_type="homepage",
            title="Test Block 2",
            block_type="image",
            content="This is the second test content block.",
            image=self.test_image,
            order=2,
            is_visible=True,
        )

        # Create hidden content block
        self.hidden_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Hidden Block",
            block_type="text",
            content="This block should not appear in API response.",
            order=3,
            is_visible=False,
        )

    def test_get_homepage_success(self) -> None:
        """Test successful homepage retrieval"""
        response = self.client.get("/api/homepage/")

        assert response.status_code == 200
        data = response.json()

        # Check basic homepage data
        assert data["organization_name"] == "Test Organization"
        assert data["tagline"] == "Building test coalitions"
        assert data["hero_title"] == "Welcome to Test Organization"
        assert data["hero_subtitle"] == "Making a difference in testing"
        assert data["hero_background_image_url"] == self.hero_bg_url
        assert data["is_active"]

        # Check social media URLs
        assert data["facebook_url"] == "https://facebook.com/testorg"
        assert data["twitter_url"] == "https://twitter.com/testorg"
        assert data["instagram_url"] == "https://instagram.com/testorg"
        assert data["linkedin_url"] == "https://linkedin.com/company/testorg"

        # Check CTA data
        assert data["cta_title"] == "Join Our Test"
        assert data["cta_content"] == "Help us test this platform"
        assert data["cta_button_text"] == "Get Started"
        assert data["cta_button_url"] == "https://example.com/join"

        # Check campaigns section
        assert data["campaigns_section_title"] == "Test Campaigns"
        assert data["campaigns_section_subtitle"] == "Our current testing initiatives"
        assert data["show_campaigns_section"]

    def test_get_homepage_no_active_homepage(self) -> None:
        """Test homepage retrieval when no active homepage exists"""
        # Deactivate the homepage
        self.homepage.is_active = False
        self.homepage.save()

        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        data = response.json()
        # Verify default homepage was created
        assert data["organization_name"] == "Coalition Builder"
        assert data["tagline"] == "Building strong advocacy partnerships"
        assert data["hero_title"] == "Welcome to Coalition Builder"
        assert data["is_active"] is True

    def test_get_homepage_no_homepage_exists(self) -> None:
        """Test homepage retrieval when no homepage exists at all"""
        # Delete the homepage
        self.homepage.delete()

        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        data = response.json()
        # Verify default homepage was created
        assert data["organization_name"] == "Coalition Builder"
        assert data["tagline"] == "Building strong advocacy partnerships"
        assert data["hero_title"] == "Welcome to Coalition Builder"
        assert (
            data["hero_subtitle"]
            == "Empowering advocates to build strong policy coalitions"
        )
        assert data["is_active"] is True

        # Verify a new homepage was actually created in the database
        assert HomePage.objects.filter(is_active=True).exists()

    def test_get_homepage_multiple_active_returns_most_recent(self) -> None:
        """Test that when multiple active homepages exist, most recent is returned"""
        # Create another active homepage (bypassing validation by using bulk_create)
        HomePage.objects.bulk_create(
            [
                HomePage(
                    organization_name="Second Organization",
                    tagline="Second tagline",
                    hero_title="Second Hero Title",
                    is_active=True,
                ),
            ],
        )

        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        data = response.json()
        # Should return the more recent homepage (the second one)
        assert data["organization_name"] == "Second Organization"
        assert data["tagline"] == "Second tagline"

    def test_content_blocks_ordering(self) -> None:
        """Test that content blocks are returned in correct order"""
        # Create additional blocks with different orders
        ContentBlock.objects.create(
            page_type="homepage",
            title="Block Order 0",
            content="First block",
            order=0,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Block Order 5",
            content="Last block",
            order=5,
            is_visible=True,
        )

        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        blocks_response = self.client.get("/api/content-blocks/?page_type=homepage")
        assert blocks_response.status_code == 200
        content_blocks = blocks_response.json()

        # Should be ordered by order field
        expected_order = [0, 1, 2, 5]
        actual_order = [block["order"] for block in content_blocks]
        assert actual_order == expected_order

    def test_content_blocks_with_empty_fields(self) -> None:
        """Test content blocks with empty optional fields"""
        # Create block with minimal data
        ContentBlock.objects.create(
            page_type="homepage",
            content="Minimal block content",
            order=10,
            is_visible=True,
        )

        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        blocks_response = self.client.get("/api/content-blocks/?page_type=homepage")
        assert blocks_response.status_code == 200
        content_blocks = blocks_response.json()

        # Find the minimal block
        minimal_block = None
        for block in content_blocks:
            if block["order"] == 10:
                minimal_block = block
                break

        assert minimal_block is not None
        assert minimal_block["title"] == ""
        assert minimal_block["block_type"] == "text"  # default value
        assert minimal_block["image_url"] == ""
        assert minimal_block["image_alt_text"] == ""
        assert minimal_block["css_classes"] == ""
        assert minimal_block["background_color"] == ""

    def test_homepage_api_response_structure(self) -> None:
        """Test that the API response includes all expected fields"""
        response = self.client.get("/api/homepage/")
        assert response.status_code == 200

        data = response.json()

        # Check that all expected fields are present
        required_fields = [
            "id",
            "organization_name",
            "tagline",
            "hero_title",
            "hero_subtitle",
            "hero_background_image_url",
            "cta_title",
            "cta_content",
            "cta_button_text",
            "cta_button_url",
            "facebook_url",
            "twitter_url",
            "instagram_url",
            "linkedin_url",
            "campaigns_section_title",
            "campaigns_section_subtitle",
            "show_campaigns_section",
            "is_active",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_get_homepage_by_id_success(self) -> None:
        """Test successful homepage retrieval by ID"""
        response = self.client.get(f"/api/homepage/{self.homepage.id}/")

        assert response.status_code == 200
        data = response.json()

        # Check basic homepage data
        assert data["id"] == self.homepage.id
        assert data["organization_name"] == "Test Organization"
        assert data["tagline"] == "Building test coalitions"
        assert data["is_active"]

    def test_get_homepage_by_id_not_found(self) -> None:
        """Test homepage retrieval by non-existent ID"""
        non_existent_id = 99999
        response = self.client.get(f"/api/homepage/{non_existent_id}/")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Not Found"

    def test_get_content_blocks_for_homepage(self) -> None:
        """Test retrieval of content blocks for a specific homepage"""
        response = self.client.get(
            "/api/content-blocks/?page_type=homepage",
        )

        assert response.status_code == 200
        data = response.json()

        # Should return only visible blocks, ordered by order field
        assert len(data) == 2  # Only visible blocks

        # Check ordering
        assert data[0]["order"] == 1
        assert data[1]["order"] == 2

        # Check content
        assert data[0]["title"] == "Test Block 1"
        assert data[0]["block_type"] == "text"
        assert data[0]["is_visible"]

        assert data[1]["title"] == "Test Block 2"
        assert data[1]["block_type"] == "image"
        assert data[1]["is_visible"]

        # Verify hidden block is not included
        block_titles = [block["title"] for block in data]
        assert "Hidden Block" not in block_titles

    def test_get_content_blocks_for_nonexistent_page_type(self) -> None:
        """Test content blocks retrieval for non-existent page type"""
        response = self.client.get("/api/content-blocks/?page_type=nonexistent")

        assert response.status_code == 200
        data = response.json()
        assert data == []  # Empty list for non-existent page type

    def test_get_content_blocks_empty_list(self) -> None:
        """Test content blocks retrieval for page type with no blocks"""
        # Test a page type that has no content blocks created
        response = self.client.get("/api/content-blocks/?page_type=contact")

        assert response.status_code == 200
        data = response.json()
        assert data == []  # Empty list

    def test_get_content_blocks_ordering_and_visibility(self) -> None:
        """Test that content blocks are properly ordered and filtered by visibility"""
        # Create additional blocks with different orders and visibility
        ContentBlock.objects.create(
            page_type="homepage",
            title="Block Order 0",
            content="First block",
            order=0,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Block Order 5",
            content="Last block",
            order=5,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Invisible Block",
            content="This should not appear",
            order=1.5,  # Between existing blocks
            is_visible=False,
        )

        response = self.client.get(
            "/api/content-blocks/?page_type=homepage",
        )

        assert response.status_code == 200
        data = response.json()

        # Should have 4 visible blocks (2 original + 2 new visible ones)
        assert len(data) == 4

        # Check ordering (0, 1, 2, 5) - invisible block at 1.5 should not appear
        expected_order = [0, 1, 2, 5]
        actual_order = [block["order"] for block in data]
        assert actual_order == expected_order

        # Verify invisible block is not included
        block_titles = [block["title"] for block in data]
        assert "Invisible Block" not in block_titles
        assert "Hidden Block" not in block_titles  # Original hidden block

    def test_get_content_block_by_id_success(self) -> None:
        """Test successful content block retrieval by ID"""
        response = self.client.get(
            f"/api/content-blocks/{self.content_block1.id}/",
        )

        assert response.status_code == 200
        data = response.json()

        # Check content block data
        assert data["id"] == self.content_block1.id
        assert data["title"] == "Test Block 1"
        assert data["block_type"] == "text"
        assert data["content"] == "This is the first test content block."
        assert data["order"] == 1
        assert data["is_visible"]
        assert data["image_url"] == ""
        assert data["image_alt_text"] == ""
        assert data["css_classes"] == ""
        assert data["background_color"] == ""

        # Check timestamps are present
        assert "created_at" in data
        assert "updated_at" in data

    def test_get_content_block_by_id_not_found(self) -> None:
        """Test content block retrieval by non-existent ID"""
        non_existent_id = 99999
        response = self.client.get(f"/api/content-blocks/{non_existent_id}/")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Not Found"

    def test_get_content_block_with_image_data(self) -> None:
        """Test content block retrieval with image data populated"""
        response = self.client.get(
            f"/api/content-blocks/{self.content_block2.id}/",
        )

        assert response.status_code == 200
        data = response.json()

        # Check image-specific data
        assert data["id"] == self.content_block2.id
        assert data["title"] == "Test Block 2"
        assert data["block_type"] == "image"
        assert data["image_url"] == self.content_block_img_url
        assert data["image_alt_text"] == "Test image"
        assert data["order"] == 2

    def test_get_hidden_content_block_by_id(self) -> None:
        """Test that hidden content blocks cannot be retrieved by ID in the new API"""
        # Hidden blocks should not be retrievable by ID in the new API
        response = self.client.get(
            f"/api/content-blocks/{self.hidden_block.id}/",
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Not Found"

    def test_api_endpoint_response_structure_consistency(self) -> None:
        """Test that all homepage API endpoints return consistent data structures"""
        # Test main homepage endpoint
        homepage_response = self.client.get("/api/homepage/")
        assert homepage_response.status_code == 200
        homepage_data = homepage_response.json()

        # Test homepage by ID endpoint
        homepage_by_id_response = self.client.get(f"/api/homepage/{self.homepage.id}/")
        assert homepage_by_id_response.status_code == 200
        homepage_by_id_data = homepage_by_id_response.json()

        # Both should return the same structure for the same homepage
        assert homepage_data["id"] == homepage_by_id_data["id"]
        assert (
            homepage_data["organization_name"]
            == homepage_by_id_data["organization_name"]
        )
        # Both homepage endpoints should return the same structure
        assert (
            homepage_data["organization_name"]
            == homepage_by_id_data["organization_name"]
        )

        # Test content blocks list endpoint
        blocks_response = self.client.get(
            "/api/content-blocks/?page_type=homepage",
        )
        assert blocks_response.status_code == 200
        blocks_data = blocks_response.json()

        # Both endpoints should return the same number of visible content blocks
        assert len(blocks_data) == 2  # Only visible blocks from setup

        # Test individual content block endpoint
        if blocks_data:
            first_block = blocks_data[0]
            block_response = self.client.get(
                f"/api/content-blocks/{first_block['id']}/",
            )
            assert block_response.status_code == 200
            block_data = block_response.json()

            # Individual block should match block from list
            assert first_block["id"] == block_data["id"]
            assert first_block["title"] == block_data["title"]
            assert first_block["content"] == block_data["content"]
