"""
Test HTML sanitization to prevent XSS attacks.
"""

from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.core.models import ContentBlock, HomePage


class HTMLSanitizationTest(TestCase):
    """Test that HTML content is properly sanitized to prevent XSS."""

    def test_campaign_description_xss_prevention(self) -> None:
        """Test that malicious scripts are removed from campaign descriptions."""
        campaign = PolicyCampaign.objects.create(
            name="test-campaign",
            title="Test Campaign",
            summary="Test summary",
            description=(
                '<p>Safe content</p><script>alert("XSS")</script><p>More content</p>'
            ),
        )

        # Script tag should be removed
        assert "<script>" not in campaign.description
        # Note: bleach strips tags but preserves content with strip=True
        # This is expected behavior - dangerous tags removed, text preserved
        assert 'alert("XSS")' in campaign.description
        # Safe content should remain
        assert "<p>Safe content</p>" in campaign.description
        assert "<p>More content</p>" in campaign.description

    def test_campaign_description_dangerous_attributes(self) -> None:
        """Test that dangerous attributes are removed."""
        campaign = PolicyCampaign.objects.create(
            name="test-dangerous-attrs",
            title="Test Campaign",
            summary="Test",
            description='<p onclick="evil()">Click me</p><img src="x" onerror="bad()">',
        )

        # Dangerous attributes should be removed
        assert "onclick" not in campaign.description
        assert "onerror" not in campaign.description
        # Tags should remain (img not in allowed list so will be removed)
        assert "<p>Click me</p>" in campaign.description
        # img tag should be stripped but its attributes text may remain
        assert "<img" not in campaign.description

    def test_campaign_description_javascript_urls(self) -> None:
        """Test that javascript: URLs are sanitized."""
        campaign = PolicyCampaign.objects.create(
            name="test-js-urls",
            title="Test Campaign",
            summary="Test",
            description='<a href="javascript:alert(1)">Click</a><a href="https://example.com">Safe</a>',
        )

        # javascript: URLs should be removed
        assert "javascript:" not in campaign.description
        # Safe URLs should remain - check for exact href attribute
        assert 'href="https://example.com"' in campaign.description
        assert "<a" in campaign.description

    def test_campaign_description_javascript_urls_case_insensitive(self) -> None:
        """Test that javascript: URLs are sanitized regardless of case."""
        campaign = PolicyCampaign.objects.create(
            name="test-js-case",
            title="Test Campaign",
            summary="Test",
            description=(
                '<a href="JavaScript:alert(1)">Click1</a>'
                '<a href="JAVASCRIPT:alert(2)">Click2</a>'
                '<a href="JaVaScRiPt:alert(3)">Click3</a>'
                '<a href="vbscript:msgbox()">VB</a>'
                '<a href="VBScript:msgbox()">VB2</a>'
                '<a href="DATA:text/html,<script>alert(4)</script>">Data</a>'
            ),
        )

        # All case variations should be removed
        assert "javascript:" not in campaign.description.lower()
        assert "vbscript:" not in campaign.description.lower()
        assert "data:text/html" not in campaign.description.lower()
        # Links should still exist but without href attributes (bleach removes dangerous hrefs)
        assert "<a>" in campaign.description
        # Link text content is preserved
        assert "Click1" in campaign.description
        assert "Click2" in campaign.description
        assert "VB" in campaign.description

    def test_campaign_plain_text_fields_escaped(self) -> None:
        """Test that plain text fields have all HTML escaped."""
        campaign = PolicyCampaign.objects.create(
            name="test-plain-text",
            title="Test Campaign",
            summary="<script>alert('xss')</script>Normal text",
            endorsement_statement="<b>Bold</b> statement",
        )

        # All HTML should be escaped in plain text fields
        assert "&lt;script&gt;" in campaign.summary
        assert "&lt;b&gt;" in campaign.endorsement_statement
        assert "<script>" not in campaign.summary
        assert "<b>" not in campaign.endorsement_statement

    def test_content_block_sanitization(self) -> None:
        """Test ContentBlock HTML sanitization."""
        homepage = HomePage.objects.create(
            organization_name="Test Org",
            tagline="Test tagline",
            hero_title="Test",
            about_section_content="Test",
            contact_email="test@example.com",
        )

        # Test custom HTML block
        html_block = ContentBlock.objects.create(
            homepage=homepage,
            block_type="custom_html",
            content="<div><script>bad()</script><h2>Title</h2><p>Content</p></div>",
            title="<script>evil</script>Test Block",
        )

        # Script should be removed but its content preserved (bleach behavior)
        assert "<script>" not in html_block.content
        assert "bad()" in html_block.content  # Content is preserved
        assert "<h2>Title</h2>" in html_block.content
        assert "<p>Content</p>" in html_block.content
        # Title should be escaped
        assert "&lt;script&gt;" in html_block.title

    def test_allowed_html_preserved(self) -> None:
        """Test that allowed HTML tags and attributes are preserved."""
        campaign = PolicyCampaign.objects.create(
            name="test-allowed-html",
            title="Test Campaign",
            summary="Test",
            description="""
                <h1>Main Title</h1>
                <h2>Subtitle</h2>
                <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
                <ul>
                    <li>List item 1</li>
                    <li>List item 2</li>
                </ul>
                <a href="https://example.com" title="Example">Safe link</a>
                <blockquote>This is a quote</blockquote>
                <table>
                    <tr><th>Header</th><td>Data</td></tr>
                </table>
            """,
        )

        # All safe HTML should be preserved
        assert "<h1>Main Title</h1>" in campaign.description
        assert "<h2>Subtitle</h2>" in campaign.description
        assert "<strong>bold</strong>" in campaign.description
        assert "<em>italic</em>" in campaign.description
        assert "<ul>" in campaign.description
        assert "<li>List item 1</li>" in campaign.description
        # Check for exact href attribute structure to avoid substring attacks
        assert 'href="https://example.com"' in campaign.description
        assert 'title="Example"' in campaign.description
        assert "<blockquote>" in campaign.description
        assert "<table>" in campaign.description
        assert "<th>Header</th>" in campaign.description

    def test_homepage_content_sanitization(self) -> None:
        """Test HomePage model sanitization."""
        homepage = HomePage.objects.create(
            organization_name="Test Org",
            tagline="Test tagline",
            hero_title="Hero",
            hero_subtitle="<script>alert('xss')</script>Subtitle",
            about_section_content='<p>About us</p><iframe src="evil.com"></iframe>',
            cta_content='<a href="javascript:void(0)">Click</a>',
            contact_email="test@example.com",
        )

        # Plain text fields should be escaped
        assert "&lt;script&gt;" in homepage.hero_subtitle
        assert "<script>" not in homepage.hero_subtitle

        # HTML fields should be sanitized
        assert "<p>About us</p>" in homepage.about_section_content
        assert "<iframe>" not in homepage.about_section_content
        assert "javascript:" not in homepage.cta_content
