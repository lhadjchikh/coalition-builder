"""Link an admin screen to the guide page that explains it.

Mixing :class:`HelpLinkAdminMixin` into a ``ModelAdmin`` puts a one-line banner
above its list and its form pointing at ``help_page_slug``. Keeping the mapping
here — one declaration per admin class — means the guide and the screens it
describes stay wired together in a single visible place.
"""

from typing import TYPE_CHECKING, Any

from django.http import HttpRequest, HttpResponse
from django.urls import reverse

from .pages import get_page

if TYPE_CHECKING:
    from django.contrib.admin import ModelAdmin

    _AdminBase = ModelAdmin[Any]
else:
    _AdminBase = object


class HelpLinkAdminMixin(_AdminBase):
    """Adds a contextual link to the admin guide. Set ``help_page_slug`` to use it."""

    help_page_slug: str = ""

    change_list_template = "admin_help/change_list.html"
    change_form_template = "admin_help/change_form.html"

    def changelist_view(
        self,
        request: HttpRequest,
        extra_context: dict[str, Any] | None = None,
    ) -> HttpResponse:
        return super().changelist_view(request, self._with_help_link(extra_context))

    def changeform_view(
        self,
        request: HttpRequest,
        object_id: str | None = None,
        form_url: str = "",
        extra_context: dict[str, Any] | None = None,
    ) -> HttpResponse:
        return super().changeform_view(
            request,
            object_id,
            form_url,
            self._with_help_link(extra_context),
        )

    def _with_help_link(
        self,
        extra_context: dict[str, Any] | None,
    ) -> dict[str, Any]:
        page = get_page(self.help_page_slug)
        if page is None:
            return extra_context or {}
        return {
            **(extra_context or {}),
            "admin_help_url": reverse("admin_help:page", args=[page.slug]),
            "admin_help_title": page.title,
        }
