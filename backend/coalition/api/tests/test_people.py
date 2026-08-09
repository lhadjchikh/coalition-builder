"""Public API tests for team listings and optional biography pages."""

from unittest.mock import patch

from django.test import Client

from coalition.content.models import HomePage, Image, Person, PersonGroup
from coalition.test_base import BaseTestCase


class PeopleAPITest(BaseTestCase):
    """The people API exposes only publishable, explicitly public fields."""

    def setUp(self) -> None:
        super().setUp()
        self.client = Client()

    def test_returns_visible_groups_and_active_people_in_staff_order(self) -> None:
        later_group = PersonGroup.objects.create(name="Fellows", order=2)
        first_group = PersonGroup.objects.create(
            name="Community Advisors",
            description="Local leaders",
            order=1,
        )
        later_person = self.create_person(first_group, "Later Person", order=2)
        first_person = self.create_person(first_group, "First Person", order=1)
        fellow = self.create_person(later_group, "Fellow", order=1)

        response = self.client.get("/api/people/")

        assert response.status_code == 200
        payload = response.json()
        assert [group["name"] for group in payload] == [
            "Community Advisors",
            "Fellows",
        ]
        assert payload[0]["description"] == "Local leaders"
        assert [person["id"] for person in payload[0]["people"]] == [
            first_person.pk,
            later_person.pk,
        ]
        assert payload[1]["people"][0]["id"] == fellow.pk

    def test_excludes_hidden_empty_and_inactive_content(self) -> None:
        visible = PersonGroup.objects.create(name="Visible")
        inactive_only = PersonGroup.objects.create(name="Inactive Only")
        PersonGroup.objects.create(name="Empty")
        hidden = PersonGroup.objects.create(name="Hidden", is_visible=False)
        visible_person = self.create_person(visible, "Visible Person")
        self.create_person(inactive_only, "Inactive Person", is_active=False)
        self.create_person(hidden, "Hidden Person")

        response = self.client.get("/api/people/")

        assert response.status_code == 200
        assert response.json() == [
            {
                "id": visible.pk,
                "name": "Visible",
                "slug": "visible",
                "description": "",
                "order": 0,
                "people": [self.expected_person(visible_person)],
            },
        ]

    def test_returns_empty_successful_response_when_nothing_is_publishable(
        self,
    ) -> None:
        hidden = PersonGroup.objects.create(name="Hidden", is_visible=False)
        inactive = PersonGroup.objects.create(name="Inactive")
        self.create_person(hidden, "Hidden Person")
        self.create_person(inactive, "Inactive Person", is_active=False)

        response = self.client.get("/api/people/")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_never_serializes_email_or_bio(self) -> None:
        group = PersonGroup.objects.create(name="Staff")
        self.create_person(
            group,
            "Jane Doe",
            email="private@example.com",
            bio="<p>Full private listing biography.</p>",
            profile_page_enabled=True,
        )

        response = self.client.get("/api/people/")
        response_text = response.content.decode()

        assert response.status_code == 200
        assert "email" not in response_text
        assert "private@example.com" not in response_text
        assert "bio" not in response_text
        assert "Full private listing biography" not in response_text

    def test_serializes_profile_image_attribution_and_profile_state(self) -> None:
        group = PersonGroup.objects.create(name="Staff")
        image = Image.objects.create(
            title="Portrait",
            alt_text="Jane at a podium",
            author="Photographer",
            license="CC BY 4.0",
            source_url="https://example.com/photo",
            caption="Portrait credit",
            caption_display="below",
        )
        person = self.create_person(
            group,
            "Jane Doe",
            profile_image=image,
            bio="<p>Full biography.</p>",
            profile_page_enabled=True,
            linkedin_url="https://www.linkedin.com/in/jane-doe",
        )

        with patch.object(
            Image,
            "image_url",
            new_callable=lambda: property(lambda _image: "https://cdn.test/jane.jpg"),
        ):
            response = self.client.get("/api/people/")

        public_person = response.json()[0]["people"][0]
        assert public_person == self.expected_person(
            person,
            profile_image_url="https://cdn.test/jane.jpg",
            profile_image_alt_text="Jane at a podium",
            profile_image_title="Portrait",
            profile_image_author="Photographer",
            profile_image_license="CC BY 4.0",
            profile_image_source_url="https://example.com/photo",
            profile_image_caption="Portrait credit",
            profile_image_caption_display="below",
        )

    def test_no_profile_image_serializes_empty_attribution_fields(self) -> None:
        group = PersonGroup.objects.create(name="Staff")
        person = self.create_person(group, "Jane Doe")

        response = self.client.get("/api/people/")

        assert response.json()[0]["people"][0] == self.expected_person(person)

    def test_enabled_profile_detail_exposes_bio_but_never_email(self) -> None:
        group = PersonGroup.objects.create(name="Staff")
        person = self.create_person(
            group,
            "Jane Doe",
            email="private@example.com",
            bio="<p>Full biography.</p>",
            profile_page_enabled=True,
        )

        response = self.client.get(f"/api/people/{person.slug}/")
        response_text = response.content.decode()

        assert response.status_code == 200
        assert response.json()["bio"] == "<p>Full biography.</p>"
        assert "email" not in response_text
        assert "private@example.com" not in response_text

    def test_profile_detail_is_404_when_not_publicly_reachable(self) -> None:
        disabled_group = PersonGroup.objects.create(name="Disabled Profile")
        inactive_group = PersonGroup.objects.create(name="Inactive Person")
        hidden_group = PersonGroup.objects.create(name="Hidden Group", is_visible=False)
        people = (
            self.create_person(disabled_group, "Disabled", bio="<p>Bio</p>"),
            self.create_person(
                inactive_group,
                "Inactive",
                bio="<p>Bio</p>",
                profile_page_enabled=True,
                is_active=False,
            ),
            self.create_person(
                hidden_group,
                "Hidden",
                bio="<p>Bio</p>",
                profile_page_enabled=True,
            ),
        )

        for person in people:
            with self.subTest(person=person.name):
                response = self.client.get(f"/api/people/{person.slug}/")
                assert response.status_code == 404

        assert self.client.get("/api/people/unknown/").status_code == 404

    def test_router_rejects_public_write_methods(self) -> None:
        for method in (
            self.client.post,
            self.client.put,
            self.client.patch,
            self.client.delete,
        ):
            with self.subTest(method=method.__name__):
                response = method(
                    "/api/people/", data={}, content_type="application/json"
                )
                assert response.status_code == 405

    def test_query_count_is_constant_for_people_and_profile_images(self) -> None:
        image = Image.objects.create(title="Portrait", alt_text="Portrait")
        first_group = PersonGroup.objects.create(name="Group 0")
        self.create_person(first_group, "Person 0", profile_image=image)

        with self.assertNumQueries(2):
            small_response = self.client.get("/api/people/")
        assert small_response.status_code == 200

        groups = [
            PersonGroup.objects.create(name=f"Group {index}", order=index)
            for index in range(1, 5)
        ]
        Person.objects.bulk_create(
            [
                Person(
                    group=group,
                    name=f"Person {group_index}-{person_index}",
                    slug=f"person-{group_index}-{person_index}",
                    title="Member",
                    profile_image=image,
                    order=person_index,
                )
                for group_index, group in enumerate(groups, start=1)
                for person_index in range(25)
            ],
        )

        with self.assertNumQueries(2):
            large_response = self.client.get("/api/people/")
        assert large_response.status_code == 200

    def test_homepage_reports_team_content_availability(self) -> None:
        HomePage.objects.create(
            organization_name="Test Organization",
            tagline="Test tagline",
            hero_title="Test hero",
            is_active=True,
        )

        empty_response = self.client.get("/api/homepage/")
        group = PersonGroup.objects.create(name="Staff")
        self.create_person(group, "Jane Doe")
        available_response = self.client.get("/api/homepage/")

        assert empty_response.json()["has_team_content"] is False
        assert available_response.json()["has_team_content"] is True

    def create_person(
        self,
        group: PersonGroup,
        name: str,
        **overrides: object,
    ) -> Person:
        attributes: dict[str, object] = {
            "group": group,
            "name": name,
            "title": "Member",
        }
        attributes.update(overrides)
        return Person.objects.create(**attributes)

    @staticmethod
    def expected_person(person: Person, **overrides: object) -> dict[str, object]:
        expected: dict[str, object] = {
            "id": person.pk,
            "name": person.name,
            "slug": person.slug,
            "title": person.title,
            "linkedin_url": person.linkedin_url,
            "order": person.order,
            "profile_page_enabled": person.profile_page_enabled,
            "profile_image_url": "",
            "profile_image_alt_text": "",
            "profile_image_title": "",
            "profile_image_author": "",
            "profile_image_license": "",
            "profile_image_source_url": "",
            "profile_image_caption": "",
            "profile_image_caption_display": "",
        }
        expected.update(overrides)
        return expected
