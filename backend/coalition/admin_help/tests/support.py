"""Shared setup for the tests that render real admin HTML."""

from django.test import override_settings

# Deployments serve static files through a hashed manifest that `collectstatic`
# writes; the test suite never runs it, so any template calling {% static %} would
# raise instead of rendering. Swapping in the plain backend keeps these tests about
# the guide rather than about asset pipelines.
without_static_manifest = override_settings(
    STORAGES={
        "default": {"BACKEND": "coalition.core.storage.MediaStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    },
)
