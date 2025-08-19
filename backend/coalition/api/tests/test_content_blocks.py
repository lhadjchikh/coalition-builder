from unittest.mock import patch

from django.test.client import Client

from coalition.content.models import ContentBlock, HomePage, Image, Theme
from coalition.test_base import BaseTestCase


class ContentBlockAPITest(BaseTestCase):
    def setUp(self) -> None:
        """Set up test data"""
        super().setUp()
        self.client = Client()

        # Mock S3 URLs for image properties
        self.image_block_url = (
            "https://test-bucket.s3.amazonaws.com/content_blocks/image-block.jpg"
        )
        self.text_image_block_url = (
            "https://test-bucket.s3.amazonaws.com/content_blocks/text-image-block.jpg"
        )

        # Create test data
        self._setup_test_data()

        # Patch the properties at the class level so ALL instances return mock URLs
        self.content_block_patch = patch.object(
            ContentBlock,
            "image_url",
            new_callable=lambda: property(
                lambda self: (
                    "https://test-bucket.s3.amazonaws.com/content_blocks/image-block.jpg"
                    if self.block_type == "image"
                    else (
                        "https://test-bucket.s3.amazonaws.com/content_blocks/text-image-block.jpg"
                        if self.block_type == "text_image"
                        else ""
                    )
                ),
            ),
        )

        self.content_block_patch.start()

    def tearDown(self) -> None:
        # Stop the patches
        self.content_block_patch.stop()

    def _setup_test_data(self) -> None:
        # Create test theme
        self.theme = Theme.objects.create(
            name="Test Theme",
            primary_color="#2563eb",
            google_fonts=[],
            is_active=True,
        )

        # Create test homepage
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test Hero Title",
            theme=self.theme,
            is_active=True,
        )

        # Create test images
        self.test_image = Image.objects.create(
            title="Beautiful Landscape",
            alt_text="Test image description",
            author="Jane Photographer",
            license="CC BY 2.0",
            source_url="https://unsplash.com/photo/123",
            image_type="content",
        )

        self.test_image2 = Image.objects.create(
            title="City Skyline",
            alt_text="Another test image",
            author="John Photographer",
            license="All rights reserved",
            source_url="https://photographer.com/portfolio",
            image_type="content",
        )

        # Create test content blocks
        self.text_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Text Block",
            block_type="text",
            content="This is a text content block.",
            order=1,
            is_visible=True,
        )

        self.image_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Image Block",
            block_type="image",
            content="This is an image block with attribution.",
            image=self.test_image,
            order=2,
            is_visible=True,
        )

        self.text_image_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Text + Image Block",
            block_type="text_image",
            content="This block combines text and image.",
            image=self.test_image2,
            css_classes="featured-block",
            background_color="#f8f9fa",
            order=3,
            is_visible=True,
        )

        # Create hidden content block
        self.hidden_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Hidden Block",
            block_type="text",
            content="This block should not appear in API responses.",
            order=4,
            is_visible=False,
        )

    def test_list_content_blocks_for_homepage(self) -> None:
        """Test GET /api/content-blocks/?page_type=homepage returns visible blocks"""
        response = self.client.get(
            "/api/content-blocks/?page_type=homepage",
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3  # Only visible blocks

        # Check ordering
        assert data[0]["order"] == 1
        assert data[1]["order"] == 2
        assert data[2]["order"] == 3

        # Check that hidden block is not included
        block_titles = [block["title"] for block in data]
        assert "Hidden Block" not in block_titles

    def test_list_content_blocks_empty_page_type(self) -> None:
        """Test content blocks for page type with no blocks"""
        response = self.client.get(
            "/api/content-blocks/?page_type=about",
        )

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_content_blocks_invalid_page_type(self) -> None:
        """Test content blocks for invalid page type"""
        response = self.client.get("/api/content-blocks/?page_type=nonexistent")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_content_blocks_missing_page_type(self) -> None:
        """Test content blocks without page_type parameter"""
        response = self.client.get("/api/content-blocks/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should return all visible content blocks across all page types
        assert len(data) >= 3

    def test_get_content_block_by_id(self) -> None:
        """Test GET /api/content-blocks/{id}/ returns specific block"""
        response = self.client.get(f"/api/content-blocks/{self.text_block.id}/")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == self.text_block.id
        assert data["title"] == "Text Block"
        assert data["block_type"] == "text"
        assert data["content"] == "This is a text content block."
        assert data["order"] == 1
        assert data["is_visible"] is True

        # Check empty image attribution fields for text block
        assert data["image_url"] == ""
        assert data["image_alt_text"] == ""
        assert data["image_title"] == ""
        assert data["image_author"] == ""
        assert data["image_license"] == ""
        assert data["image_source_url"] == ""

    def test_get_content_block_with_image_attribution(self) -> None:
        """Test content block with complete image attribution data"""
        response = self.client.get(f"/api/content-blocks/{self.image_block.id}/")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == self.image_block.id
        assert data["title"] == "Image Block"
        assert data["block_type"] == "image"
        assert data["image_alt_text"] == "Test image description"

        # Check image URL for image block
        assert data["image_url"] == self.image_block_url

        # Check image attribution fields
        assert data["image_title"] == "Beautiful Landscape"
        assert data["image_author"] == "Jane Photographer"
        assert data["image_license"] == "CC BY 2.0"
        assert data["image_source_url"] == "https://unsplash.com/photo/123"

    def test_get_content_block_with_styling_options(self) -> None:
        """Test content block with CSS classes and background color"""
        response = self.client.get(f"/api/content-blocks/{self.text_image_block.id}/")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == self.text_image_block.id
        assert data["title"] == "Text + Image Block"
        assert data["block_type"] == "text_image"
        assert data["css_classes"] == "featured-block"
        assert data["background_color"] == "#f8f9fa"

        # Check image URL for text_image block
        assert data["image_url"] == self.text_image_block_url

        # Check image attribution fields for this block
        assert data["image_title"] == "City Skyline"
        assert data["image_author"] == "John Photographer"
        assert data["image_license"] == "All rights reserved"
        assert data["image_source_url"] == "https://photographer.com/portfolio"

    def test_get_content_block_not_found(self) -> None:
        """Test GET /api/content-blocks/{id}/ with non-existent ID"""
        response = self.client.get("/api/content-blocks/99999/")

        assert response.status_code == 404

    def test_get_hidden_content_block_forbidden(self) -> None:
        """Test that hidden content blocks cannot be retrieved by ID"""
        response = self.client.get(f"/api/content-blocks/{self.hidden_block.id}/")

        assert response.status_code == 404

    def test_content_block_ordering(self) -> None:
        """Test that content blocks are returned in correct order"""
        # Create additional blocks with different orders
        ContentBlock.objects.create(
            page_type="homepage",
            title="First Block",
            content="Should be first",
            order=0,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Last Block",
            content="Should be last",
            order=10,
            is_visible=True,
        )

        response = self.client.get("/api/content-blocks/?page_type=homepage")

        assert response.status_code == 200
        data = response.json()

        # Should be ordered by order field
        expected_orders = [0, 1, 2, 3, 10]
        actual_orders = [block["order"] for block in data]
        assert actual_orders == expected_orders

    def test_content_block_filtering_by_visibility(self) -> None:
        """Test that only visible content blocks are returned"""
        # Create mix of visible and hidden blocks
        ContentBlock.objects.create(
            page_type="homepage",
            title="Visible Block 1",
            content="Should appear",
            order=5,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Hidden Block 1",
            content="Should not appear",
            order=6,
            is_visible=False,
        )

        ContentBlock.objects.create(
            page_type="homepage",
            title="Visible Block 2",
            content="Should appear",
            order=7,
            is_visible=True,
        )

        response = self.client.get("/api/content-blocks/?page_type=homepage")

        assert response.status_code == 200
        data = response.json()

        # Should only include visible blocks
        block_titles = [block["title"] for block in data]
        assert "Visible Block 1" in block_titles
        assert "Visible Block 2" in block_titles
        assert "Hidden Block 1" not in block_titles
        assert "Hidden Block" not in block_titles  # Original hidden block

    def test_content_block_response_structure(self) -> None:
        """Test that content block response includes all expected fields"""
        response = self.client.get(f"/api/content-blocks/{self.image_block.id}/")

        assert response.status_code == 200
        data = response.json()

        # Check that all expected fields are present
        required_fields = [
            "id",
            "title",
            "block_type",
            "content",
            "image_url",
            "image_alt_text",
            "image_title",
            "image_author",
            "image_license",
            "image_source_url",
            "css_classes",
            "background_color",
            "order",
            "is_visible",
            "created_at",
            "updated_at",
        ]

        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_content_block_types(self) -> None:
        """Test different content block types"""
        # Create blocks of different types
        quote_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Quote Block",
            block_type="quote",
            content="This is an inspiring quote.",
            order=20,
            is_visible=True,
        )

        stats_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Stats Block",
            block_type="stats",
            content="50% improvement in efficiency",
            order=21,
            is_visible=True,
        )

        custom_html_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Custom HTML Block",
            block_type="custom_html",
            content="<div class='custom'>Custom HTML content</div>",
            order=22,
            is_visible=True,
        )

        # Test each block type
        for block in [quote_block, stats_block, custom_html_block]:
            response = self.client.get(f"/api/content-blocks/{block.id}/")
            assert response.status_code == 200
            data = response.json()
            assert data["block_type"] == block.block_type
            assert data["title"] == block.title

    def test_content_block_image_attribution_combinations(self) -> None:
        """Test various combinations of image attribution fields"""
        # Create an image with partial attribution
        partial_image = Image.objects.create(
            title="Mountain View",
            alt_text="Partial image",
            author="Anonymous",
            # No license or source URL
            image_type="content",
        )

        # Block with only title and author
        partial_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Partial Attribution",
            block_type="image",
            content="Image with partial attribution",
            image=partial_image,
            order=30,
            is_visible=True,
        )

        response = self.client.get(f"/api/content-blocks/{partial_block.id}/")

        assert response.status_code == 200
        data = response.json()

        assert data["image_title"] == "Mountain View"
        assert data["image_author"] == "Anonymous"
        assert data["image_license"] == ""
        assert data["image_source_url"] == ""

    def test_content_blocks_across_different_page_types(self) -> None:
        """Test content blocks for different page types"""
        # Create content blocks for different page types
        ContentBlock.objects.create(
            page_type="about",
            title="About Page Block",
            content="Content for about page",
            order=1,
            is_visible=True,
        )

        ContentBlock.objects.create(
            page_type="campaigns",
            title="Campaigns Page Block",
            content="Content for campaigns page",
            order=1,
            is_visible=True,
        )

        # Test filtering by specific page type
        response_homepage = self.client.get("/api/content-blocks/?page_type=homepage")
        response_about = self.client.get("/api/content-blocks/?page_type=about")
        response_campaigns = self.client.get("/api/content-blocks/?page_type=campaigns")

        assert response_homepage.status_code == 200
        assert response_about.status_code == 200
        assert response_campaigns.status_code == 200

        data_homepage = response_homepage.json()
        data_about = response_about.json()
        data_campaigns = response_campaigns.json()

        # Each page type should only return its own blocks
        assert len(data_homepage) >= 3  # At least the blocks from setUp
        assert len(data_about) == 1  # Only the about block we just created
        assert len(data_campaigns) == 1  # Only the campaigns block we just created

        # Verify the content is correct
        about_block = data_about[0]
        campaigns_block = data_campaigns[0]

        assert about_block["title"] == "About Page Block"
        assert about_block["page_type"] == "about"
        assert campaigns_block["title"] == "Campaigns Page Block"
        assert campaigns_block["page_type"] == "campaigns"
