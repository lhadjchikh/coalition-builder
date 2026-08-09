"""Read-only pages for the in-admin help guide.

Access control lives in :mod:`coalition.admin_help.urls`, where every view is
wrapped in ``admin.site.admin_view``: signed-in staff only, everyone else is sent
to the admin login.
"""

from typing import Any

from django.contrib import admin
from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import render as render_to_response

from .pages import HELP_PAGES, get_page, neighbors
from .renderer import render

GUIDE_TITLE = "Admin guide"


def index(request: HttpRequest) -> HttpResponse:
    """List the guide's pages, so a new admin can see the whole shape of the job."""
    return render_to_response(
        request,
        "admin_help/index.html",
        _admin_context(request, GUIDE_TITLE),
    )


def page(request: HttpRequest, slug: str) -> HttpResponse:
    """Show one page of the guide."""
    requested = get_page(slug)
    if requested is None:
        raise Http404(f"No help page named {slug!r}")

    previous_page, next_page = neighbors(requested)
    return render_to_response(
        request,
        "admin_help/page.html",
        {
            **_admin_context(request, requested.title, subtitle=GUIDE_TITLE),
            "page": requested,
            "rendered": render(requested),
            "previous_page": previous_page,
            "next_page": next_page,
        },
    )


def all_pages(request: HttpRequest) -> HttpResponse:
    """Show the whole guide on one page, for printing or searching with Ctrl-F."""
    return render_to_response(
        request,
        "admin_help/all.html",
        {
            **_admin_context(request, GUIDE_TITLE, subtitle="Complete guide"),
            "sections": [(entry, render(entry)) for entry in HELP_PAGES],
        },
    )


def _admin_context(
    request: HttpRequest,
    title: str,
    subtitle: str = "",
) -> dict[str, Any]:
    """Combine the admin's own template context with what the guide templates need."""
    return {
        **admin.site.each_context(request),
        "title": title,
        "subtitle": subtitle,
        "pages": HELP_PAGES,
    }
