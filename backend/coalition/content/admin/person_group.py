"""Admin configuration for staff-configurable team groups."""

from collections.abc import Sequence
from typing import Any

from django.contrib import admin
from django.db.models import Count, QuerySet
from django.http import HttpRequest
from django.utils.html import format_html

from coalition.admin_help.admin_links import HelpLinkAdminMixin
from coalition.content.models import Person, PersonGroup


class PersonInline(admin.TabularInline):
    """Edit listing order and publication controls within a group."""

    model = Person
    fields = (
        "name",
        "title",
        "order",
        "is_active",
    )
    ordering = ("order", "pk")
    extra = 0


@admin.register(PersonGroup)
class PersonGroupAdmin(HelpLinkAdminMixin, admin.ModelAdmin):
    """Manage public team sections and their ordered people."""

    help_page_slug = "team"
    list_display = ("name", "order", "is_visible", "person_count")
    list_filter = ("is_visible",)
    list_editable = ("order", "is_visible")
    search_fields = ("name", "description")
    readonly_fields = ("slug",)
    fields = ("name", "slug", "description", "order", "is_visible")
    inlines = (PersonInline,)

    def get_queryset(self, request: HttpRequest) -> QuerySet[PersonGroup]:
        """Load the list-page person totals without per-group queries."""
        visible_group_ids = super().get_queryset(request).values("pk")
        return PersonGroup.objects.filter(pk__in=visible_group_ids).annotate(
            _person_count=Count("people"),
        )

    @admin.display(description="People", ordering="_person_count")
    def person_count(self, obj: PersonGroup) -> int:
        """Return the annotated number of people assigned to the group."""
        return int(getattr(obj, "_person_count", 0))

    def get_deleted_objects(
        self,
        objs: Sequence[Any] | QuerySet[Any],
        request: HttpRequest,
    ) -> tuple[list[Any], dict[str, int], set[str], list[Any]]:
        """Add actionable guidance when protected people prevent group deletion."""
        deleted_objects, model_count, perms_needed, protected = (
            super().get_deleted_objects(objs, request)
        )
        group_ids = [obj.pk for obj in objs if isinstance(obj, PersonGroup)]
        groups = list(PersonGroup.objects.filter(pk__in=group_ids))
        populated_group_ids = set(
            Person.objects.filter(group_id__in=group_ids)
            .values_list("group_id", flat=True)
            .distinct(),
        )
        protected_group_messages = [
            format_html(
                'Cannot delete "{}": people are still assigned to this group. '
                "Please reassign or delete those people first.",
                group.name,
            )
            for group in groups
            if group.pk in populated_group_ids
        ]
        return (
            deleted_objects,
            model_count,
            perms_needed,
            [*protected, *protected_group_messages],
        )
