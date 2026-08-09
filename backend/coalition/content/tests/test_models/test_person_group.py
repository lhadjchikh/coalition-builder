"""Behavioral tests for staff-configurable team groups."""

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from coalition.content.models import PersonGroup
from coalition.test_base import BaseTestCase


class PersonGroupModelTest(BaseTestCase):
    """Person groups remain ordered, valid, and safe to rename."""

    def test_persists_fields_and_defaults(self) -> None:
        group = PersonGroup.objects.create(name="Board of Directors")

        assert group.name == "Board of Directors"
        assert group.slug == "board-of-directors"
        assert group.description == ""
        assert group.order == 0
        assert group.is_visible is True

    def test_orders_by_order_then_primary_key(self) -> None:
        second = PersonGroup.objects.create(name="Second", order=2)
        first_earlier = PersonGroup.objects.create(name="First Earlier", order=1)
        first_later = PersonGroup.objects.create(name="First Later", order=1)

        assert list(PersonGroup.objects.all()) == [first_earlier, first_later, second]

    def test_sanitizes_name_and_description_before_saving(self) -> None:
        group = PersonGroup.objects.create(
            name=" <b>Community</b> ",
            description='<img src="x" onerror="alert(1)">Advisors',
        )

        group.refresh_from_db()
        assert group.name == "Community"
        assert group.description == "Advisors"
        assert "<" not in group.name + group.description

    def test_keeps_slug_stable_when_name_changes(self) -> None:
        group = PersonGroup.objects.create(name="Original Name")

        group.name = "New Name"
        group.save()
        group.refresh_from_db()

        assert group.name == "New Name"
        assert group.slug == "original-name"

    def test_suffixes_colliding_name_derived_slugs(self) -> None:
        first = PersonGroup.objects.create(name="Policy & Research")
        second = PersonGroup.objects.create(name="Policy Research")
        third = PersonGroup.objects.create(name="Policy--Research")

        assert first.slug == "policy-research"
        assert second.slug == "policy-research-2"
        assert third.slug == "policy-research-3"

    def test_rejects_duplicate_group_name(self) -> None:
        PersonGroup.objects.create(name="Staff")

        with self.assertRaises(ValidationError) as raised:
            PersonGroup.objects.create(name="Staff")

        assert "name" in raised.exception.message_dict

    def test_database_enforces_unique_slug(self) -> None:
        first = PersonGroup.objects.create(name="Staff")

        with self.assertRaises(IntegrityError), transaction.atomic():
            PersonGroup.objects.bulk_create(
                [PersonGroup(name="Other", slug=first.slug)],
            )

    def test_rejects_blank_name_after_sanitization(self) -> None:
        for name in ("", "   ", "<b> </b>"):
            with self.subTest(name=name), self.assertRaises(ValidationError) as raised:
                PersonGroup.objects.create(name=name)

            assert "name" in raised.exception.message_dict

    def test_rejects_negative_order(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            PersonGroup.objects.create(name="Invalid", order=-1)

        assert "order" in raised.exception.message_dict

    def test_accepts_zero_order(self) -> None:
        group = PersonGroup.objects.create(name="Valid", order=0)

        assert group.order == 0
