from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from coalition.content.models import ContentBlock, HomePage, Video


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

        assert "Hero overlay color must be a valid hex color code" in str(cm.exception)

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


class VideoModelTest(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass",
        )

        # Create a simple video file for testing
        self.video_file = SimpleUploadedFile(
            "test_video.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        self.video_data = {
            "video": self.video_file,
            "title": "Test Video",
            "alt_text": "A test video",
            "description": "Description of test video",
            "author": "Test Author",
            "license": "CC BY 4.0",
            "source_url": "https://example.com/video",
            "video_type": "hero",
            "uploaded_by": self.user,
        }

    def test_create_video(self) -> None:
        """Test creating a video with valid data"""
        video = Video.objects.create(**self.video_data)
        assert video.title == "Test Video"
        assert video.alt_text == "A test video"
        assert video.description == "Description of test video"
        assert video.author == "Test Author"
        assert video.license == "CC BY 4.0"
        assert video.source_url == "https://example.com/video"
        assert video.video_type == "hero"
        assert video.uploaded_by == self.user
        assert video.autoplay is True  # default
        assert video.loop is True  # default
        assert video.muted is True  # default
        assert video.show_controls is False  # default

    def test_video_str_representation(self) -> None:
        """Test string representation of video"""
        video = Video.objects.create(**self.video_data)
        assert str(video) == "Test Video"

    def test_video_url_property(self) -> None:
        """Test video_url property"""
        video = Video.objects.create(**self.video_data)
        assert video.video_url != ""
        assert "test_video" in video.video_url

    def test_video_url_property_no_file(self) -> None:
        """Test video_url property when no file"""
        video = Video()
        assert video.video_url == ""

    def test_autoplay_muted_validation(self) -> None:
        """Test that autoplay videos must be muted"""
        invalid_data = self.video_data.copy()
        invalid_data["autoplay"] = True
        invalid_data["muted"] = False
        invalid_data["video"] = SimpleUploadedFile(
            "test_video2.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        video = Video(**invalid_data)
        with self.assertRaises(ValidationError) as cm:
            video.full_clean()

        assert "Autoplay videos must be muted" in str(cm.exception)

    def test_video_file_extension_validation(self) -> None:
        """Test video file extension validation"""
        from coalition.content.models.video import validate_video_file_extension

        # Test invalid extension
        invalid_file = SimpleUploadedFile(
            "test_video.avi",
            b"file_content",
            content_type="video/avi",
        )

        with self.assertRaises(ValidationError) as cm:
            validate_video_file_extension(invalid_file)

        assert "Unsupported file extension .avi" in str(cm.exception)

        # Test valid extensions
        valid_extensions = [".mov", ".mp4", ".webm"]
        for ext in valid_extensions:
            valid_file = SimpleUploadedFile(
                f"test_video{ext}",
                b"file_content",
                content_type=f"video/{ext[1:]}",
            )
            # Should not raise
            validate_video_file_extension(valid_file)

    def test_html_sanitization_on_save(self) -> None:
        """Test that HTML is sanitized on save"""
        data = self.video_data.copy()
        data["title"] = "<script>alert('xss')</script>Test Video"
        data["alt_text"] = "<b>Bold</b> alt text"
        data["description"] = "<p>Test <script>alert('xss')</script> description</p>"
        data["author"] = "<em>Test</em> Author"
        data["license"] = "CC <script>alert('xss')</script> BY"
        data["video"] = SimpleUploadedFile(
            "test_video3.mp4",
            b"file_content",
            content_type="video/mp4",
        )

        video = Video.objects.create(**data)

        # Title, alt_text, author, license should be plain text
        assert video.title == "alert('xss')Test Video"
        assert video.alt_text == "Bold alt text"
        assert video.author == "Test Author"
        assert video.license == "CC alert('xss') BY"

        # Description can have some HTML but not scripts
        assert "<script>" not in video.description
        assert "<p>" in video.description  # Safe tags are kept

    def test_video_types(self) -> None:
        """Test all valid video types"""
        valid_types = ["general", "hero", "content", "campaign"]

        for video_type in valid_types:
            data = self.video_data.copy()
            data["video_type"] = video_type
            data["title"] = f"Test {video_type} Video"
            data["video"] = SimpleUploadedFile(
                f"test_{video_type}.mp4",
                b"file_content",
                content_type="video/mp4",
            )
            video = Video.objects.create(**data)
            assert video.video_type == video_type

    def test_default_values(self) -> None:
        """Test that default values are set correctly"""
        minimal_data = {
            "video": SimpleUploadedFile(
                "minimal.mp4",
                b"file_content",
                content_type="video/mp4",
            ),
            "title": "Minimal Video",
            "alt_text": "Minimal alt text",
        }
        video = Video.objects.create(**minimal_data)

        assert video.description == ""
        assert video.author == ""
        assert video.license == ""
        assert video.source_url == ""
        assert video.video_type == "general"
        assert video.autoplay is True
        assert video.loop is True
        assert video.muted is True
        assert video.show_controls is False
        assert video.uploaded_by is None
