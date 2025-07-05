from django.test import TestCase
from django.test.client import Client

from coalition.core.models import ContentBlock, HomePage, Theme


class ContentBlockAPITest(TestCase):
    def setUp(self) -> None:
        """Set up test data"""
        self.client = Client()

        # Create test theme
        self.theme = Theme.objects.create(
            name="Test Theme",
            primary_color="#2563eb",
            is_active=True,
        )

        # Create test homepage
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test Hero Title",
            about_section_content="Test about content",
            contact_email="test@example.com",
            theme=self.theme,
            is_active=True,
        )

        # Create test content blocks with image attribution
        self.text_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Text Block",
            block_type="text",
            content="This is a text content block.",
            order=1,
            is_visible=True,
        )

        self.image_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Image Block",
            block_type="image",
            content="This is an image block with attribution.",
            image_url="https://example.com/test-image.jpg",
            image_alt_text="Test image description",
            image_title="Beautiful Landscape",
            image_author="Jane Photographer",
            image_license="CC BY 2.0",
            image_source_url="https://unsplash.com/photo/123",
            order=2,
            is_visible=True,
        )

        self.text_image_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Text + Image Block",
            block_type="text_image",
            content="This block combines text and image.",
            image_url="https://example.com/another-image.jpg",
            image_alt_text="Another test image",
            image_title="City Skyline",
            image_author="John Photographer",
            image_license="All rights reserved",
            image_source_url="https://photographer.com/portfolio",
            css_classes="featured-block",
            background_color="#f8f9fa",
            order=3,
            is_visible=True,
        )

        # Create hidden content block
        self.hidden_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Hidden Block",
            block_type="text",
            content="This block should not appear in API responses.",
            order=4,
            is_visible=False,
        )

    def test_list_content_blocks_for_homepage(self) -> None:
        """Test GET /api/content-blocks/?homepage_id={id} returns visible blocks"""
        response = self.client.get(
            f"/api/content-blocks/?homepage_id={self.homepage.id}",
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

    def test_list_content_blocks_empty_homepage(self) -> None:
        """Test content blocks for homepage with no blocks"""
        empty_homepage = HomePage.objects.create(
            organization_name="Empty Org",
            tagline="Empty",
            hero_title="Empty",
            about_section_content="Empty",
            contact_email="empty@test.com",
            is_active=False,
        )

        response = self.client.get(
            f"/api/content-blocks/?homepage_id={empty_homepage.id}",
        )

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_content_blocks_nonexistent_homepage(self) -> None:
        """Test content blocks for non-existent homepage"""
        response = self.client.get("/api/content-blocks/?homepage_id=99999")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_content_blocks_missing_homepage_id(self) -> None:
        """Test content blocks without homepage_id parameter"""
        response = self.client.get("/api/content-blocks/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should return all visible content blocks across all homepages
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
        assert data["image_url"] == "https://example.com/test-image.jpg"
        assert data["image_alt_text"] == "Test image description"

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
            homepage=self.homepage,
            title="First Block",
            content="Should be first",
            order=0,
            is_visible=True,
        )

        ContentBlock.objects.create(
            homepage=self.homepage,
            title="Last Block",
            content="Should be last",
            order=10,
            is_visible=True,
        )

        response = self.client.get(
            f"/api/content-blocks/?homepage_id={self.homepage.id}",
        )

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
            homepage=self.homepage,
            title="Visible Block 1",
            content="Should appear",
            order=5,
            is_visible=True,
        )

        ContentBlock.objects.create(
            homepage=self.homepage,
            title="Hidden Block 1",
            content="Should not appear",
            order=6,
            is_visible=False,
        )

        ContentBlock.objects.create(
            homepage=self.homepage,
            title="Visible Block 2",
            content="Should appear",
            order=7,
            is_visible=True,
        )

        response = self.client.get(
            f"/api/content-blocks/?homepage_id={self.homepage.id}",
        )

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
            homepage=self.homepage,
            title="Quote Block",
            block_type="quote",
            content="This is an inspiring quote.",
            order=20,
            is_visible=True,
        )

        stats_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Stats Block",
            block_type="stats",
            content="50% improvement in efficiency",
            order=21,
            is_visible=True,
        )

        custom_html_block = ContentBlock.objects.create(
            homepage=self.homepage,
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
        # Block with only title and author
        partial_block = ContentBlock.objects.create(
            homepage=self.homepage,
            title="Partial Attribution",
            block_type="image",
            content="Image with partial attribution",
            image_url="https://example.com/partial.jpg",
            image_alt_text="Partial image",
            image_title="Mountain View",
            image_author="Anonymous",
            # No license or source URL
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

    def test_content_blocks_across_multiple_homepages(self) -> None:
        """Test content blocks when multiple homepages exist"""
        # Create second homepage with its own content blocks
        homepage2 = HomePage.objects.create(
            organization_name="Second Org",
            tagline="Second tagline",
            hero_title="Second Hero",
            about_section_content="Second about",
            contact_email="second@test.com",
            is_active=False,
        )

        ContentBlock.objects.create(
            homepage=homepage2,
            title="Second Homepage Block",
            content="Content for second homepage",
            order=1,
            is_visible=True,
        )

        # Test filtering by specific homepage
        response1 = self.client.get(
            f"/api/content-blocks/?homepage_id={self.homepage.id}",
        )
        response2 = self.client.get(f"/api/content-blocks/?homepage_id={homepage2.id}")

        assert response1.status_code == 200
        assert response2.status_code == 200

        data1 = response1.json()
        data2 = response2.json()

        # First homepage should have original blocks
        assert len(data1) == 3
        homepage1_titles = [block["title"] for block in data1]
        assert "Text Block" in homepage1_titles
        assert "Second Homepage Block" not in homepage1_titles

        # Second homepage should have only its block
        assert len(data2) == 1
        assert data2[0]["title"] == "Second Homepage Block"
