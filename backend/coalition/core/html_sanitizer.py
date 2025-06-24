"""
HTML sanitization utilities to prevent XSS attacks.
"""

import bleach


class HTMLSanitizer:
    """Sanitize HTML content to prevent XSS attacks while preserving safe formatting."""

    # Safe HTML tags that are allowed
    ALLOWED_TAGS = [
        # Text formatting
        "p",
        "br",
        "span",
        "div",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "mark",
        "sub",
        "sup",
        "small",
        # Headings
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        # Lists
        "ul",
        "ol",
        "li",
        "dl",
        "dt",
        "dd",
        # Links
        "a",
        # Quotes and code
        "blockquote",
        "q",
        "cite",
        "pre",
        "code",
        "kbd",
        "samp",
        "var",
        # Tables
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "th",
        "td",
        "caption",
        "colgroup",
        "col",
        # Other semantic elements
        "hr",
        "abbr",
        "address",
        "time",
    ]

    # Allowed attributes for specific tags
    ALLOWED_ATTRIBUTES = {
        # Links - only href and title, no javascript: or data: URLs
        "a": ["href", "title", "rel"],
        # Tables
        "table": ["class"],
        "th": ["scope", "colspan", "rowspan"],
        "td": ["colspan", "rowspan"],
        # General styling (limited)
        "*": ["class"],
    }

    # Allowed URL schemes for links
    ALLOWED_PROTOCOLS = ["http", "https", "mailto", "tel"]

    @classmethod
    def sanitize(cls, html: str | None, strip: bool = True) -> str:
        """
        Sanitize HTML content to remove dangerous tags and attributes.

        Args:
            html: The HTML content to sanitize
            strip: Whether to strip disallowed tags (True) or escape them (False)

        Returns:
            Sanitized HTML safe for rendering
        """
        if not html:
            return ""

        # Clean the HTML
        cleaned = bleach.clean(
            html,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            protocols=cls.ALLOWED_PROTOCOLS,
            strip=strip,
            strip_comments=True,
        )

        # Additional safety: remove any sneaky javascript: URLs that might slip through
        cleaned = cleaned.replace("javascript:", "")
        cleaned = cleaned.replace("vbscript:", "")
        cleaned = cleaned.replace("data:text/html", "")

        return cleaned

    @classmethod
    def sanitize_plain_text(cls, text: str | None) -> str:
        """
        Sanitize plain text by escaping all HTML entities.
        Use this for fields that should never contain HTML.

        Args:
            text: Plain text to sanitize

        Returns:
            Text with all HTML escaped
        """
        if not text:
            return ""

        # This escapes ALL HTML, converting < to &lt; etc
        # Use strip=False to escape tags rather than remove them
        return bleach.clean(text, tags=[], strip=False)
