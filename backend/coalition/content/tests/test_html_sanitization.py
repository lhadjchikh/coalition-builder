"""
Test HTML sanitization to prevent XSS attacks.
"""

from django.test import TestCase

from coalition.campaigns.models import PolicyCampaign
from coalition.content.html_sanitizer import HTMLSanitizer
from coalition.content.models import ContentBlock, HomePage


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
        # Links should still exist but without href attributes
        # (bleach removes dangerous hrefs)
        assert "<a>" in campaign.description
        # Link text content is preserved
        assert "Click1" in campaign.description
        assert "Click2" in campaign.description
        assert "VB" in campaign.description

    def test_campaign_plain_text_fields_stripped(self) -> None:
        """Test that plain text fields have HTML tags removed."""
        campaign = PolicyCampaign.objects.create(
            name="test-plain-text",
            title="Test Campaign",
            summary="<script>alert('xss')</script>Normal text",
            endorsement_statement="<b>Bold</b> statement",
        )

        # HTML tags should be stripped but content preserved
        assert "alert('xss')Normal text" in campaign.summary
        assert "Bold statement" in campaign.endorsement_statement
        assert "<script>" not in campaign.summary
        assert "<b>" not in campaign.endorsement_statement

    def test_content_block_sanitization(self) -> None:
        """Test ContentBlock HTML sanitization."""

        # Test custom HTML block
        html_block = ContentBlock.objects.create(
            page_type="homepage",
            block_type="custom_html",
            content="<div><script>bad()</script><h2>Title</h2><p>Content</p></div>",
            title="<script>evil</script>Test Block",
        )

        # Script should be removed but its content preserved (bleach behavior)
        assert "<script>" not in html_block.content
        assert "bad()" in html_block.content  # Content is preserved
        assert "<h2>Title</h2>" in html_block.content
        assert "<p>Content</p>" in html_block.content
        # Title should have tags stripped but content preserved
        assert "evilTest Block" in html_block.title
        assert "<script>" not in html_block.title

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
            cta_content='<a href="javascript:void(0)">Click</a>',
        )

        # Plain text fields should have tags stripped but content preserved
        assert "alert('xss')Subtitle" in homepage.hero_subtitle
        assert "<script>" not in homepage.hero_subtitle

        # HTML fields should be sanitized
        assert "javascript:" not in homepage.cta_content

    def test_html_sanitizer_direct_null_input_handling(self) -> None:
        """Test HTMLSanitizer direct methods with null/empty inputs."""
        # Test sanitize method with None and empty string
        assert HTMLSanitizer.sanitize(None) == ""
        assert HTMLSanitizer.sanitize("") == ""
        assert HTMLSanitizer.sanitize("   ") == "   "  # Whitespace preserved

        # Test sanitize_plain_text method with None and empty string
        assert HTMLSanitizer.sanitize_plain_text(None) == ""
        assert HTMLSanitizer.sanitize_plain_text("") == ""
        assert HTMLSanitizer.sanitize_plain_text("   ") == ""  # Whitespace is trimmed

    def test_html_sanitizer_edge_cases(self) -> None:
        """Test additional edge cases for HTML sanitizer."""
        # Test with only whitespace in HTML
        result = HTMLSanitizer.sanitize("  <p>   </p>  ")
        assert "<p>   </p>" in result

        # Test plain text with HTML-like content
        result = HTMLSanitizer.sanitize_plain_text("<not>really</html>")
        assert result == "really"  # Tags stripped, content preserved

        # Test with mixed content
        result = HTMLSanitizer.sanitize("<p>Good</p><script>bad()</script>")
        assert "<p>Good</p>" in result
        assert "<script>" not in result
        assert "bad()" in result  # Content preserved, tag removed

    def test_style_tags_and_inline_styles_allowed(self) -> None:
        """Test that style tags and inline styles are preserved."""
        # Test style tag
        html_with_style = """
            <style type="text/css">
                .custom-class { color: red; }
                p { margin: 10px; }
            </style>
            <p class="custom-class">Styled paragraph</p>
        """
        result = HTMLSanitizer.sanitize(html_with_style)
        assert "<style" in result
        assert 'type="text/css"' in result
        assert ".custom-class { color: red; }" in result
        assert "p { margin: 10px; }" in result

        # Test inline styles
        html_with_inline = """
            <p style="color: blue; font-size: 16px;">Blue text</p>
            <div style="background-color: #f0f0f0; padding: 20px;">
                <span style="font-weight: bold;">Bold span</span>
            </div>
        """
        result = HTMLSanitizer.sanitize(html_with_inline)
        assert 'style="color: blue; font-size: 16px;"' in result
        assert 'style="background-color: #f0f0f0; padding: 20px;"' in result
        assert 'style="font-weight: bold;"' in result

        # Test ContentBlock with style
        from coalition.content.models import ContentBlock

        block = ContentBlock.objects.create(
            page_type="homepage",
            block_type="custom_html",
            content="""
                <style>.highlight { background: yellow; }</style>
                <p style="text-align: center;">Centered text</p>
                <span class="highlight" style="padding: 5px;">Highlighted</span>
            """,
        )
        assert "<style>" in block.content
        assert ".highlight { background: yellow; }" in block.content
        assert 'style="text-align: center;"' in block.content
        assert 'style="padding: 5px;"' in block.content

    def test_sanitize_plain_text_edge_cases(self) -> None:
        """Test that sanitize_plain_text handles edge cases correctly."""
        # Test mathematical comparisons
        result = HTMLSanitizer.sanitize_plain_text("5 < 10 and 10 > 5")
        assert result == "5 < 10 and 10 > 5"

        # Test malformed HTML
        result = HTMLSanitizer.sanitize_plain_text("a<bd")
        assert result == "a<bd"

        # Test mixed content
        result = HTMLSanitizer.sanitize_plain_text("text < 5 > text")
        assert result == "text < 5 > text"

        # Test email-like pattern with angle brackets
        # Note: bleach interprets <domain> as an HTML tag, which is correct behavior
        result = HTMLSanitizer.sanitize_plain_text("email@<domain>.com")
        assert result == "email@.com"

        # Test proper HTML removal
        result = HTMLSanitizer.sanitize_plain_text("normal <b>bold</b> text")
        assert result == "normal bold text"

        # Test nested tags
        result = HTMLSanitizer.sanitize_plain_text("<div><p>nested</p></div>")
        assert result == "nested"

        # Test self-closing tags
        result = HTMLSanitizer.sanitize_plain_text("before<br/>after")
        assert result == "beforeafter"

        # Test HTML entities in input
        result = HTMLSanitizer.sanitize_plain_text("&lt;tag&gt; & &amp; test")
        assert result == "<tag> & & test"
