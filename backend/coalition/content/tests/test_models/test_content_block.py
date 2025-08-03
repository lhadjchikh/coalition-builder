from django.test import TestCase

from coalition.content.html_sanitizer import HTMLSanitizer
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
        assert block.animation_type == "none"
        assert block.animation_delay == 0

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

    def test_heading_tags_preserved(self) -> None:
        """Test that all heading tags (h1-h6) are preserved."""
        html = """
        <h1>Main Heading</h1>
        <h2>Subheading</h2>
        <h3>Section Title</h3>
        <h4>Subsection</h4>
        <h5>Minor Heading</h5>
        <h6>Smallest Heading</h6>
        <p>Regular paragraph</p>
        """

        sanitized = HTMLSanitizer.sanitize(html)

        # All headings should be preserved
        assert "<h1>Main Heading</h1>" in sanitized
        assert "<h2>Subheading</h2>" in sanitized
        assert "<h3>Section Title</h3>" in sanitized
        assert "<h4>Subsection</h4>" in sanitized
        assert "<h5>Minor Heading</h5>" in sanitized
        assert "<h6>Smallest Heading</h6>" in sanitized
        assert "<p>Regular paragraph</p>" in sanitized

    def test_svg_elements_preserved(self) -> None:
        """Test that SVG elements and attributes are preserved."""
        svg = """
        <svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="red" stroke="black" stroke-width="2"/>
            <rect x="10" y="10" width="30" height="30" fill="blue" opacity="0.5"/>
            <path d="M 10 10 L 90 90" stroke="green" stroke-width="3"/>
            <g fill="orange">
                <polygon points="50,10 90,90 10,90"/>
            </g>
        </svg>
        """

        sanitized = HTMLSanitizer.sanitize(svg)

        # Check SVG elements are preserved
        assert '<svg viewBox="0 0 100 100"' in sanitized
        assert '<circle cx="50" cy="50" r="40"' in sanitized
        assert '<rect x="10" y="10"' in sanitized
        assert '<path d="M 10 10 L 90 90"' in sanitized
        assert '<g fill="orange">' in sanitized
        assert '<polygon points="50,10 90,90 10,90"' in sanitized

        # Check attributes are preserved
        assert 'fill="red"' in sanitized
        assert 'stroke="black"' in sanitized
        assert 'stroke-width="2"' in sanitized
        assert 'opacity="0.5"' in sanitized

    def test_svg_with_text(self) -> None:
        """Test SVG with text elements."""
        svg = """
        <svg viewBox="0 0 200 50">
            <text x="10" y="30" font-family="Arial" font-size="20" fill="black">
                Hello World
                <tspan x="10" y="45" font-size="14">Subtitle</tspan>
            </text>
        </svg>
        """

        sanitized = HTMLSanitizer.sanitize(svg)

        assert '<text x="10" y="30"' in sanitized
        assert 'font-family="Arial"' in sanitized
        assert 'font-size="20"' in sanitized
        assert '<tspan x="10" y="45"' in sanitized
        assert "Hello World" in sanitized
        assert "Subtitle" in sanitized

    def test_svg_gradients_and_defs(self) -> None:
        """Test SVG with gradients and defs."""
        svg = """
        <svg>
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="yellow" stop-opacity="1"/>
                    <stop offset="100%" stop-color="red" stop-opacity="1"/>
                </linearGradient>
            </defs>
            <rect fill="url(#grad1)" x="0" y="0" width="100" height="50"/>
        </svg>
        """

        sanitized = HTMLSanitizer.sanitize(svg)

        assert "<defs>" in sanitized
        assert '<linearGradient id="grad1"' in sanitized
        assert '<stop offset="0%"' in sanitized
        assert 'stop-color="yellow"' in sanitized
        assert 'fill="url(#grad1)"' in sanitized

    def test_content_block_with_svg_and_headings(self) -> None:
        """Test ContentBlock model with SVG and headings."""
        content_with_svg_and_headings = """
        <h2>Our Mission</h2>
        <p>We believe in sustainability.</p>
        <svg viewBox="0 0 100 100" width="50" height="50">
            <circle cx="50" cy="50" r="40" fill="green"/>
        </svg>
        <h3>Key Points</h3>
        <ul>
            <li>Point 1</li>
            <li>Point 2</li>
        </ul>
        """

        block = ContentBlock.objects.create(
            page_type="homepage",
            block_type="text",
            content=content_with_svg_and_headings,
            order=1,
        )

        # Refresh from DB to get sanitized content
        block.refresh_from_db()

        # Check that headings are preserved
        assert "<h2>Our Mission</h2>" in block.content
        assert "<h3>Key Points</h3>" in block.content

        # Check that SVG is preserved
        assert '<svg viewBox="0 0 100 100"' in block.content
        assert '<circle cx="50" cy="50" r="40"' in block.content
        assert 'fill="green"' in block.content

        # Check that other content is preserved
        assert "<p>We believe in sustainability.</p>" in block.content
        assert "<ul>" in block.content
        assert "<li>Point 1</li>" in block.content

    def test_dangerous_svg_attributes_removed(self) -> None:
        """Test that dangerous SVG attributes are removed."""
        dangerous_svg = """
        <svg onload="alert('XSS')">
            <circle cx="50" cy="50" r="40" onclick="alert('XSS')"/>
            <script>alert('XSS')</script>
        </svg>
        """

        sanitized = HTMLSanitizer.sanitize(dangerous_svg)

        # Dangerous attributes and script tags should be removed
        assert "onload" not in sanitized
        assert "onclick" not in sanitized
        assert "<script>" not in sanitized

        # But the SVG structure should remain
        assert "<svg>" in sanitized
        assert "<circle" in sanitized

    def test_target_blank_links_allowed(self) -> None:
        """Test that target="_blank" is allowed on links."""
        html_with_target = """
        <p>Visit our 
        <a href="https://example.com" target="_blank" rel="noopener">website</a>.</p>
        <p>Check our <a href="https://example.org" target="_self">documentation</a>.</p>
        <p>Bad link: <a href="javascript:alert('XSS')" target="_blank">click me</a></p>
        """

        sanitized = HTMLSanitizer.sanitize(html_with_target)

        # target="_blank" should be preserved
        assert 'target="_blank"' in sanitized
        assert 'rel="noopener"' in sanitized
        assert 'target="_self"' in sanitized

        # But javascript: URLs should be removed
        assert "javascript:" not in sanitized
        assert "alert(" not in sanitized

    def test_tinymce_content_with_target_blank(self) -> None:
        """Test that content from TinyMCE with target="_blank" is preserved."""
        # This simulates content that would come from TinyMCE
        tinymce_content = """
        <p>Check out our 
        <a href="https://example.com" target="_blank" rel="noopener noreferrer">
        external resource</a> for more information.</p>
        <p>Also visit <a href="/internal-page">our documentation</a>.</p>
        """

        block = ContentBlock.objects.create(
            page_type="homepage",
            block_type="text",
            content=tinymce_content,
            order=1,
        )

        # Refresh from DB to get sanitized content
        block.refresh_from_db()

        # target="_blank" should be preserved
        assert 'target="_blank"' in block.content
        assert 'rel="noopener noreferrer"' in block.content
        assert 'href="https://example.com"' in block.content
        assert 'href="/internal-page"' in block.content

    def test_animation_options(self) -> None:
        """Test all valid animation options."""
        valid_animations = [
            ("fade-in", "Fade In"),
            ("slide-up", "Slide Up"),
            ("slide-left", "Slide from Left"),
            ("slide-right", "Slide from Right"),
            ("scale", "Scale In"),
            ("none", "No Animation"),
        ]

        for animation_value, animation_label in valid_animations:
            block = ContentBlock.objects.create(
                page_type="homepage",
                title=f"Test {animation_label}",
                content="Test content",
                animation_type=animation_value,
                order=1,
            )
            assert block.animation_type == animation_value

    def test_animation_delay(self) -> None:
        """Test animation delay values."""
        # Test various delay values
        delay_values = [0, 100, 500, 1000, 2000]

        for delay in delay_values:
            block = ContentBlock.objects.create(
                page_type="homepage",
                title=f"Test delay {delay}",
                content="Test content",
                animation_delay=delay,
                order=1,
            )
            assert block.animation_delay == delay

    def test_animation_with_different_block_types(self) -> None:
        """Test animation options work with all block types."""
        block_types = ["text", "image", "text_image", "quote", "stats", "custom_html"]

        for block_type in block_types:
            block = ContentBlock.objects.create(
                page_type="homepage",
                title=f"Test {block_type} with animation",
                block_type=block_type,
                content="Test content",
                animation_type="slide-up",
                animation_delay=300,
                order=1,
            )
            assert block.block_type == block_type
            assert block.animation_type == "slide-up"
            assert block.animation_delay == 300

    def test_default_animation_is_none(self) -> None:
        """Test that default animation is 'none'."""
        block = ContentBlock.objects.create(
            page_type="homepage",
            title="Test default animation",
            content="Test content",
            order=1,
        )
        assert block.animation_type == "none"
