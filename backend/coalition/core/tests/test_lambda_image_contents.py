"""The Lambda image must ship every directory the settings tell Django to read.

``docker/app/Dockerfile.lambda`` builds what actually runs in production, and it
copies an enumerated list of paths rather than the whole tree. Anything settings
reference but that list omits fails only at runtime, in production: a template
outside an installed app resolves to Django's fallback or raises
``TemplateDoesNotExist``, with nothing at build or test time to say why. Deriving
the expectation from ``settings.TEMPLATES`` keeps that list honest as the
settings change.
"""

from pathlib import Path, PurePosixPath

from django.conf import settings
from django.test import SimpleTestCase

LAMBDA_DOCKERFILE = Path(settings.BASE_DIR) / "docker" / "app" / "Dockerfile.lambda"


def _copied_sources() -> set[str]:
    """Build-context paths copied to matching locations below ``WORKDIR``."""
    return _sources_copied_to_workdir(LAMBDA_DOCKERFILE.read_text())


def _sources_copied_to_workdir(dockerfile: str) -> set[str]:
    """Sources whose image destination matches their build-context path."""
    workdir = PurePosixPath("/")
    sources: set[str] = set()
    for line in dockerfile.splitlines():
        instruction = line.strip()
        if instruction.upper().startswith("WORKDIR "):
            configured_workdir = PurePosixPath(instruction.split(maxsplit=1)[1])
            workdir = (
                configured_workdir
                if configured_workdir.is_absolute()
                else workdir / configured_workdir
            )
            continue
        if not instruction.upper().startswith("COPY "):
            continue
        arguments = [
            argument
            for argument in instruction.split()[1:]
            if not argument.startswith("--")
        ]
        destination = PurePosixPath(arguments[-1])
        resolved_destination = (
            destination if destination.is_absolute() else workdir / destination
        )
        for argument in arguments[:-1]:
            source = PurePosixPath(argument)
            if resolved_destination == workdir / source:
                sources.add(str(source))
    return sources


def _template_dirs_below_base() -> list[str]:
    """Names of configured template directories that live inside ``BASE_DIR``."""
    base = Path(settings.BASE_DIR).resolve()
    configured = (Path(entry).resolve() for entry in settings.TEMPLATES[0]["DIRS"])
    return [
        str(directory.relative_to(base))
        for directory in configured
        if directory.is_relative_to(base)
    ]


class LambdaImageCopiesConfiguredTemplateDirsTest(SimpleTestCase):
    """A configured template directory left out of the image breaks only in prod."""

    def test_copy_source_at_wrong_destination_does_not_count(self) -> None:
        dockerfile = """\
WORKDIR /var/task
COPY coalition/ ./coalition/
COPY templates/ ./scripts/
"""

        assert "templates" not in _sources_copied_to_workdir(dockerfile)

    def test_the_dockerfile_copy_list_is_readable(self) -> None:
        """Guards the two tests below against silently parsing nothing."""
        assert "coalition" in _copied_sources()

    def test_settings_configure_a_template_dir_inside_the_project(self) -> None:
        """Guards the test below against passing on an empty expectation."""
        assert _template_dirs_below_base()

    def test_every_configured_template_dir_is_copied_into_the_image(self) -> None:
        copied = _copied_sources()

        for directory in _template_dirs_below_base():
            with self.subTest(template_dir=directory):
                assert directory in copied, (
                    f"settings.TEMPLATES reads {directory}/ but "
                    f"{LAMBDA_DOCKERFILE.name} never copies it into the image"
                )
