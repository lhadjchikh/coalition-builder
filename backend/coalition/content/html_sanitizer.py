"""
HTML sanitization utilities to prevent XSS attacks.
"""

import re

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
        # SVG elements
        "svg",
        "path",
        "g",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "ellipse",
        "text",
        "tspan",
        "defs",
        "symbol",
        "clipPath",
        "mask",
        "pattern",
        "linearGradient",
        "radialGradient",
        "stop",
        "animate",
        "animateTransform",
        # Style tag for custom CSS
        "style",
    ]

    # Allowed attributes for specific tags
    ALLOWED_ATTRIBUTES = {
        # Links - href, title, target and rel attributes
        # Note: javascript: and data: URLs are blocked by ALLOWED_PROTOCOLS
        "a": ["href", "title", "target", "rel"],
        # Tables
        "table": ["class"],
        "th": ["scope", "colspan", "rowspan"],
        "td": ["colspan", "rowspan"],
        # SVG attributes
        "svg": [
            "viewBox",
            "width",
            "height",
            "xmlns",
            "fill",
            "stroke",
            "stroke-width",
            "class",
            "style",
            "preserveAspectRatio",
            "transform",
        ],
        "path": [
            "d",
            "fill",
            "stroke",
            "stroke-width",
            "stroke-linecap",
            "stroke-linejoin",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "g": [
            "fill",
            "stroke",
            "stroke-width",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "circle": [
            "cx",
            "cy",
            "r",
            "fill",
            "stroke",
            "stroke-width",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "rect": [
            "x",
            "y",
            "width",
            "height",
            "rx",
            "ry",
            "fill",
            "stroke",
            "stroke-width",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "line": [
            "x1",
            "y1",
            "x2",
            "y2",
            "stroke",
            "stroke-width",
            "stroke-linecap",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "polyline": [
            "points",
            "fill",
            "stroke",
            "stroke-width",
            "stroke-linecap",
            "stroke-linejoin",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "polygon": [
            "points",
            "fill",
            "stroke",
            "stroke-width",
            "stroke-linecap",
            "stroke-linejoin",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "ellipse": [
            "cx",
            "cy",
            "rx",
            "ry",
            "fill",
            "stroke",
            "stroke-width",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "text": [
            "x",
            "y",
            "fill",
            "font-family",
            "font-size",
            "font-weight",
            "text-anchor",
            "opacity",
            "transform",
            "class",
            "style",
        ],
        "tspan": [
            "x",
            "y",
            "dx",
            "dy",
            "fill",
            "font-family",
            "font-size",
            "font-weight",
            "text-anchor",
            "class",
            "style",
        ],
        "defs": ["class"],
        "symbol": ["id", "viewBox", "preserveAspectRatio", "class"],
        "clipPath": ["id", "class"],
        "mask": ["id", "x", "y", "width", "height", "class"],
        "pattern": [
            "id",
            "x",
            "y",
            "width",
            "height",
            "patternUnits",
            "patternContentUnits",
            "patternTransform",
            "class",
        ],
        "linearGradient": [
            "id",
            "x1",
            "y1",
            "x2",
            "y2",
            "gradientUnits",
            "gradientTransform",
            "class",
        ],
        "radialGradient": [
            "id",
            "cx",
            "cy",
            "r",
            "fx",
            "fy",
            "gradientUnits",
            "gradientTransform",
            "class",
        ],
        "stop": ["offset", "stop-color", "stop-opacity", "class"],
        "animate": [
            "attributeName",
            "values",
            "dur",
            "repeatCount",
            "begin",
            "end",
            "fill",
            "class",
        ],
        "animateTransform": [
            "attributeName",
            "type",
            "values",
            "dur",
            "repeatCount",
            "begin",
            "end",
            "fill",
            "class",
        ],
        # Style tag attributes
        "style": ["type"],
        # General styling (limited)
        "*": ["class", "style"],
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

        # Import CSS sanitizer
        from bleach.css_sanitizer import CSSSanitizer

        # Create CSS sanitizer that allows common CSS properties
        css_sanitizer = CSSSanitizer(
            allowed_css_properties=[
                # Text styling
                "color",
                "background-color",
                "font-size",
                "font-weight",
                "font-style",
                "font-family",
                "text-align",
                "text-decoration",
                "line-height",
                "letter-spacing",
                "text-transform",
                "text-indent",
                # Box model
                "margin",
                "margin-top",
                "margin-right",
                "margin-bottom",
                "margin-left",
                "padding",
                "padding-top",
                "padding-right",
                "padding-bottom",
                "padding-left",
                "border",
                "border-width",
                "border-style",
                "border-color",
                "border-top",
                "border-right",
                "border-bottom",
                "border-left",
                "border-radius",
                "width",
                "height",
                "max-width",
                "max-height",
                "min-width",
                "min-height",
                # Display and positioning
                "display",
                "position",
                "top",
                "right",
                "bottom",
                "left",
                "float",
                "clear",
                "overflow",
                "z-index",
                "visibility",
                # Flexbox
                "flex",
                "flex-direction",
                "flex-wrap",
                "justify-content",
                "align-items",
                "align-content",
                "flex-grow",
                "flex-shrink",
                "flex-basis",
                "align-self",
                # Grid
                "grid-template-columns",
                "grid-template-rows",
                "grid-gap",
                "gap",
                "grid-column",
                "grid-row",
                # Other
                "opacity",
                "background",
                "background-image",
                "background-size",
                "background-position",
                "background-repeat",
                "box-shadow",
                "text-shadow",
                "transform",
                "transition",
                "cursor",
            ],
        )

        # Clean the HTML with CSS sanitizer
        cleaned = bleach.clean(
            html,
            tags=cls.ALLOWED_TAGS,
            attributes=cls.ALLOWED_ATTRIBUTES,
            protocols=cls.ALLOWED_PROTOCOLS,
            css_sanitizer=css_sanitizer,
            strip=strip,
            strip_comments=True,
        )

        # Additional safety: remove any sneaky javascript: URLs that might slip through
        # Use regex for case-insensitive replacement, also handle whitespace variations
        cleaned = re.sub(r"javascript\s*:", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"vbscript\s*:", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"data\s*:\s*text/html", "", cleaned, flags=re.IGNORECASE)

        return cleaned

    @classmethod
    def sanitize_plain_text(cls, text: str | None) -> str:
        """
        Sanitize plain text by removing any HTML tags but preserving the text content.
        Use this for fields that should never contain HTML markup.

        Args:
            text: Plain text to sanitize

        Returns:
            Text with HTML tags removed but content preserved
        """
        if not text:
            return ""

        from html import unescape

        # Use bleach to properly parse and strip HTML tags
        # This handles malformed HTML better than regex
        cleaned = str(bleach.clean(text, tags=[], strip=True))

        # Decode HTML entities to get proper characters
        # This converts &amp; to &, &lt; to <, etc.
        # We do this after bleach to preserve characters like < and >
        # in non-HTML contexts (e.g., "5 < 10")
        cleaned = unescape(cleaned)

        # Trim whitespace
        return cleaned.strip()
