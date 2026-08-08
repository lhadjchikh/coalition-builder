"""Turn a help page's Markdown source into HTML for the admin templates.

Help content is trusted, version-controlled repository content, and is rendered
into the page as raw HTML. It must never be loaded from the database, from
uploads, or from anything in a request: :func:`render` accepts only a
:class:`~coalition.admin_help.pages.HelpPage` taken from the registry, so no
user-supplied string ever reaches the filesystem.

Each source file is rendered twice over. The Django template engine runs first,
so the prose can say ``{{ organization_name }}`` and can build deep links with
``{% url %}`` instead of hard-coding admin paths that rot silently. Markdown
conversion runs second, on the result.
"""

from dataclasses import dataclass
from pathlib import Path

import bleach
import markdown
from django.conf import settings
from django.template import Context, Template
from django.utils.safestring import SafeString

from .pages import HelpPage

CONTENT_DIR = Path(__file__).resolve().parent / "content"

DEFAULT_SUPERVISOR_CONTACT = "your supervisor"
DEFAULT_TECHNICAL_CONTACT = "whoever maintains this site for your organization"

MARKDOWN_EXTENSIONS = (
    "admonition",
    "attr_list",
    "def_list",
    "md_in_html",
    "sane_lists",
    "tables",
    "toc",
)
MARKDOWN_EXTENSION_CONFIGS = {"toc": {"permalink": "#", "toc_depth": "2-3"}}

SAFE_HTML_TAGS = {
    "a",
    "blockquote",
    "br",
    "code",
    "dd",
    "div",
    "dl",
    "dt",
    "em",
    "h2",
    "h3",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
}
SAFE_HTML_ATTRIBUTES = {
    "*": ["class"],
    "a": ["href", "title"],
    "h2": ["id"],
    "h3": ["id"],
}
SAFE_URL_PROTOCOLS = {"http", "https", "mailto", "tel"}


@dataclass(frozen=True)
class RenderedPage:
    """A page's body and its table of contents, both ready to drop into a template."""

    html: SafeString
    toc: SafeString


def deployment_context() -> dict[str, str]:
    """Values the guide's prose interpolates, so no deployment is named in the text.

    Contact details fall back to neutral wording rather than an empty string,
    because a sentence ending in "ask " reads as a bug to the person following it.
    """
    return {
        "organization_name": settings.ORGANIZATION_NAME,
        "site_url": settings.SITE_URL,
        "supervisor_contact": (
            settings.ADMIN_HELP_SUPERVISOR_CONTACT or DEFAULT_SUPERVISOR_CONTACT
        ),
        "technical_contact": (
            settings.ADMIN_HELP_TECHNICAL_CONTACT or DEFAULT_TECHNICAL_CONTACT
        ),
    }


def render_source(source: str, context: dict[str, str] | None = None) -> RenderedPage:
    """Render Markdown ``source`` as a Django template, then convert it to HTML."""
    interpolated = Template(source).render(Context(context or deployment_context()))
    converter = markdown.Markdown(
        extensions=list(MARKDOWN_EXTENSIONS),
        extension_configs=MARKDOWN_EXTENSION_CONFIGS,
    )
    html = converter.convert(interpolated)
    # The toc extension attaches this attribute during convert(), so it is invisible
    # to the type stubs. An empty table of contents fails the rendering tests.
    toc = getattr(converter, "toc", "")
    return RenderedPage(
        html=_sanitize_generated_html(html),
        toc=_sanitize_generated_html(toc),
    )


def render(page: HelpPage) -> RenderedPage:
    """Return the rendered ``page``, reusing earlier work where it is still valid.

    Content is fixed for the life of a deployment, so the result is cached under
    the deployment values it was rendered with. Caching is skipped under ``DEBUG``
    so that editing a Markdown file shows up without restarting the server.
    """
    context = deployment_context()
    if settings.DEBUG:
        return render_source(_read_source(page), context)

    cache_key = (page.slug, tuple(sorted(context.items())))
    if cache_key not in _RENDER_CACHE:
        _RENDER_CACHE[cache_key] = render_source(_read_source(page), context)
    return _RENDER_CACHE[cache_key]


def clear_cache() -> None:
    """Drop every cached render. Used by tests; deployments never need it."""
    _RENDER_CACHE.clear()


def _read_source(page: HelpPage) -> str:
    return (CONTENT_DIR / f"{page.slug}.md").read_text(encoding="utf-8")


def _sanitize_generated_html(html: str) -> SafeString:
    sanitized = bleach.clean(
        html,
        tags=SAFE_HTML_TAGS,
        attributes=SAFE_HTML_ATTRIBUTES,
        protocols=SAFE_URL_PROTOCOLS,
        strip=True,
        strip_comments=True,
    )
    return SafeString(sanitized)


_RENDER_CACHE: dict[tuple[str, tuple[tuple[str, str], ...]], RenderedPage] = {}
