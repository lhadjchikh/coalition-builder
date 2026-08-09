"""Behavioral tests for people shown on the public team pages."""

from django.core.exceptions import ValidationError
from django.db.models import PROTECT, SET_NULL, ProtectedError

from coalition.content.models import Image, Person, PersonGroup
from coalition.test_base import BaseTestCase


class PersonModelTest(BaseTestCase):
    """People enforce publishing, sanitization, and deletion boundaries."""

    def setUp(self) -> None:
        super().setUp()
        self.group = PersonGroup.objects.create(name="Fellows")

    def test_persists_fields_and_defaults(self) -> None:
        person = Person.objects.create(
            group=self.group,
            name="Jane Doe",
            title="Executive Director",
        )

        assert person.slug == "jane-doe"
        assert person.bio == ""
        assert person.headshot is None
        assert person.email == ""
        assert person.linkedin_url == ""
        assert person.order == 0
        assert person.is_active is True
        assert person.profile_page_enabled is False
        assert person.created_at is not None
        assert person.updated_at is not None

    def test_orders_by_order_then_primary_key(self) -> None:
        second = self.create_person(name="Second", order=2)
        first_earlier = self.create_person(name="First Earlier", order=1)
        first_later = self.create_person(name="First Later", order=1)

        assert list(Person.objects.all()) == [first_earlier, first_later, second]

    def test_declares_protected_group_and_nullable_headshot_boundaries(self) -> None:
        group_field = Person._meta.get_field("group")
        headshot_field = Person._meta.get_field("headshot")

        assert group_field.remote_field.on_delete is PROTECT
        assert headshot_field.remote_field.on_delete is SET_NULL
        assert headshot_field.null is True
        assert headshot_field.blank is True

    def test_sanitizes_name_title_and_bio_before_saving(self) -> None:
        person = self.create_person(
            name=" <b>Jane Doe</b> ",
            title='<img src="x" onerror="alert(1)">Director',
            bio="<p>Leads <strong>policy</strong> work.</p>",
        )

        person.refresh_from_db()
        assert person.name == "Jane Doe"
        assert person.title == "Director"
        assert person.bio == "<p>Leads <strong>policy</strong> work.</p>"

    def test_removes_script_style_and_event_handler_payloads_from_bio(self) -> None:
        person = self.create_person(
            bio=(
                '<p onclick="steal()">Before</p>'
                "<script>alert('secret')</script>"
                "<style>body{display:none}</style>"
                "<p>After</p>"
            ),
        )

        person.refresh_from_db()
        assert "onclick" not in person.bio
        assert "steal" not in person.bio
        assert "script" not in person.bio
        assert "alert" not in person.bio
        assert "style" not in person.bio
        assert "display:none" not in person.bio
        assert "Before" in person.bio
        assert "After" in person.bio

    def test_derives_unique_stable_slug_from_name(self) -> None:
        first = self.create_person(name="Jane Doe")
        second = self.create_person(name="Jane-Doe")

        first.name = "Jane Smith"
        first.save()
        first.refresh_from_db()

        assert first.slug == "jane-doe"
        assert second.slug == "jane-doe-2"

    def test_rejects_blank_name(self) -> None:
        for name in ("", "   ", "<b> </b>"):
            with self.subTest(name=name), self.assertRaises(ValidationError) as raised:
                self.create_person(name=name)

            assert "name" in raised.exception.message_dict

    def test_requires_bio_when_profile_page_is_enabled(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            self.create_person(profile_page_enabled=True, bio="   ")

        assert "bio" in raised.exception.message_dict

    def test_allows_profile_page_with_sanitized_bio(self) -> None:
        person = self.create_person(
            profile_page_enabled=True,
            bio="<p>Full biography.</p>",
        )

        assert person.profile_page_enabled is True

    def test_rejects_negative_order(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            self.create_person(order=-1)

        assert "order" in raised.exception.message_dict

    def test_rejects_malformed_linkedin_url(self) -> None:
        for linkedin_url in (
            "linkedin.com/in/jane",
            "javascript:alert(1)",
            "not a url",
        ):
            with (
                self.subTest(linkedin_url=linkedin_url),
                self.assertRaises(
                    ValidationError,
                ) as raised,
            ):
                self.create_person(linkedin_url=linkedin_url)

            assert "linkedin_url" in raised.exception.message_dict

    def test_rejects_malformed_email(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            self.create_person(email="jane at example.com")

        assert "email" in raised.exception.message_dict

    def test_accepts_optional_contact_fields_when_blank(self) -> None:
        person = self.create_person(email="", linkedin_url="")

        assert person.email == ""
        assert person.linkedin_url == ""

    def test_deleting_headshot_sets_reference_to_null(self) -> None:
        image = Image.objects.create(title="Jane", alt_text="Jane Doe")
        person = self.create_person(headshot=image)

        image.delete()
        person.refresh_from_db()

        assert person.headshot is None

    def test_deleting_person_preserves_headshot(self) -> None:
        image = Image.objects.create(title="Jane", alt_text="Jane Doe")
        person = self.create_person(headshot=image)

        person.delete()

        assert Image.objects.filter(pk=image.pk).exists()

    def test_deleting_populated_group_is_protected(self) -> None:
        self.create_person()

        with self.assertRaises(ProtectedError):
            self.group.delete()

    def create_person(self, **overrides: object) -> Person:
        attributes: dict[str, object] = {
            "group": self.group,
            "name": "Default Person",
            "title": "Advisor",
        }
        attributes.update(overrides)
        return Person.objects.create(**attributes)
