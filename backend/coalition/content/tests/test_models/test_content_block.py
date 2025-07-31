from django.test import TestCase

from coalition.content.models import ContentBlock, HomePage


class ContentBlockModelTest(TestCase):
    def setUp(self) -> None:
        self.homepage = HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Welcome",
        )

        self.content_block_data = {
            "page_type": "homepage",
            "title": "Test Content Block",
            "block_type": "text",
            "content": "This is test content for the block",
            "order": 1,
        }

    def test_create_content_block(self) -> None:
        """Test creating a content block with valid data"""
        block = ContentBlock.objects.create(**self.content_block_data)
        assert block.title == "Test Content Block"
        assert block.block_type == "text"
        assert block.content == "This is test content for the block"
        assert block.page_type == "homepage"
        assert block.order == 1
        assert block.is_visible
        assert block.created_at is not None
        assert block.updated_at is not None

    def test_content_block_str_representation(self) -> None:
        """Test string representation of content block"""
        block = ContentBlock.objects.create(**self.content_block_data)
        expected_str = "Block: Test Content Block (Homepage, Order: 1)"
        assert str(block) == expected_str

    def test_content_block_str_without_title(self) -> None:
        """Test string representation when title is blank"""
        data = self.content_block_data.copy()
        data["title"] = ""
        block = ContentBlock.objects.create(**data)
        expected_str = "Block: text (Homepage, Order: 1)"
        assert str(block) == expected_str

    def test_content_block_types(self) -> None:
        """Test all valid content block types"""
        valid_types = ["text", "image", "text_image", "quote", "stats", "custom_html"]

        for i, block_type in enumerate(valid_types):
            data = self.content_block_data.copy()
            data["block_type"] = block_type
            data["title"] = f"Test {block_type} Block"
            data["order"] = i + 1
            block = ContentBlock.objects.create(**data)
            assert block.block_type == block_type

    def test_default_values(self) -> None:
        """Test that default values are set correctly"""
        minimal_data = {
            "content": "Minimal content",
        }
        block = ContentBlock.objects.create(**minimal_data)

        assert block.title == ""
        assert block.block_type == "text"
        assert block.page_type == "homepage"
        assert block.order == 0
        assert block.is_visible
        assert block.image_url == ""
        assert block.image_alt_text == ""
        assert block.css_classes == ""
        assert block.background_color == ""

    def test_content_block_ordering(self) -> None:
        """Test that content blocks are ordered correctly"""
        # Create blocks with different orders
        block1 = ContentBlock.objects.create(
            page_type="homepage",
            title="Block 1",
            content="Content 1",
            order=3,
        )
        block2 = ContentBlock.objects.create(
            page_type="homepage",
            title="Block 2",
            content="Content 2",
            order=1,
        )
        block3 = ContentBlock.objects.create(
            page_type="homepage",
            title="Block 3",
            content="Content 3",
            order=2,
        )

        # Query all blocks - should be ordered by order field
        blocks = list(ContentBlock.objects.all())
        assert blocks[0] == block2  # order=1
        assert blocks[1] == block3  # order=2
        assert blocks[2] == block1  # order=3

    def test_content_block_page_type_filtering(self) -> None:
        """Test filtering content blocks by page type"""
        block1 = ContentBlock.objects.create(**self.content_block_data)

        data2 = self.content_block_data.copy()
        data2["title"] = "About Block"
        data2["page_type"] = "about"
        data2["order"] = 2
        block2 = ContentBlock.objects.create(**data2)

        # Test filtering by page type
        homepage_blocks = ContentBlock.objects.filter(page_type="homepage")
        assert homepage_blocks.count() == 1
        assert block1 in homepage_blocks
        assert block2 not in homepage_blocks

    def test_content_blocks_persist_after_homepage_delete(self) -> None:
        """Test that content blocks persist when homepage is deleted"""
        block = ContentBlock.objects.create(**self.content_block_data)
        block_id = block.id

        # Delete homepage
        self.homepage.delete()

        # Content block should still exist
        assert ContentBlock.objects.filter(id=block_id).exists()

    def test_visibility_filter(self) -> None:
        """Test filtering content blocks by visibility"""
        # Create visible block
        visible_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Visible Block",
            content="Visible content",
            is_visible=True,
        )

        # Create hidden block
        hidden_block = ContentBlock.objects.create(
            page_type="homepage",
            title="Hidden Block",
            content="Hidden content",
            is_visible=False,
        )

        # Filter for visible blocks only
        visible_blocks = ContentBlock.objects.filter(is_visible=True)
        assert visible_blocks.count() == 1
        assert visible_block in visible_blocks
        assert hidden_block not in visible_blocks

        # Filter for all blocks
        all_blocks = ContentBlock.objects.all()
        assert all_blocks.count() == 2
