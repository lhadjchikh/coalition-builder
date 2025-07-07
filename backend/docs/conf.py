"""Sphinx configuration for Coalition Builder API documentation."""

import os
import sys
from typing import TYPE_CHECKING

import django

if TYPE_CHECKING:
    from sphinx.application import Sphinx

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(".."))
os.environ["DJANGO_SETTINGS_MODULE"] = "coalition.core.settings"
django.setup()

# Project information
project = "Coalition Builder API"
# Use alternative name to avoid shadowing builtin
copyright = "2024, Coalition Builder Team"  # noqa: A001
author = "Coalition Builder Team"
release = "0.1.0"

# General configuration
extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
    "sphinx.ext.intersphinx",
    "sphinx_autodoc_typehints",
    "autoapi.extension",
    "myst_parser",
]

# AutoAPI configuration for Django
autoapi_type = "python"
autoapi_dirs = ["../coalition"]
autoapi_options = [
    "members",
    "undoc-members",
    "show-inheritance",
    "show-module-summary",
    "special-members",
    "imported-members",
]
autoapi_ignore = ["*/migrations/*", "*/tests/*", "**/test_*.py"]
autoapi_python_class_content = "both"
autoapi_member_order = "bysource"

# Napoleon settings for Google/NumPy style docstrings
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True

# Type hints configuration
typehints_defaults = "comma"
typehints_document_rtype = True

# MyST parser for Markdown support
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "tasklist",
]

# HTML output configuration
html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_title = "Coalition Builder API Documentation"
html_short_title = "API Docs"

# Output configuration for GitHub Pages integration
html_baseurl = "/coalition-builder/api/"
html_use_opensearch = "https://lhadjchikh.github.io/coalition-builder/api/"

# Intersphinx mapping to external documentation
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "django": (
        "https://docs.djangoproject.com/en/5.0/",
        "https://docs.djangoproject.com/en/5.0/_objects/",
    ),
    "djangoninja": ("https://django-ninja.dev/", None),
}

# Exclude patterns
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# Autodoc configuration
autodoc_default_options = {
    "members": True,
    "member-order": "bysource",
    "special-members": "__init__",
    "undoc-members": True,
    "exclude-members": "__weakref__",
}


# Custom docstring processor for Django models
def process_django_model_docstring(
    app: "Sphinx",
    what: str,
    name: str,
    obj: object,
    options: dict,
    lines: list[str],
) -> None:
    """Process Django model docstrings to include field information from help_text."""
    import inspect

    from django.db import models
    from django.utils.encoding import force_str
    from django.utils.html import strip_tags

    # Only process Django model classes - add safety checks
    if inspect.isclass(obj):
        try:
            if issubclass(obj, models.Model):
                # Get all model fields
                fields = obj._meta.get_fields()

                # Add field documentation
                if fields:
                    lines.append("")
                    lines.append("**Model Fields:**")
                    lines.append("")

                    for field in fields:
                        # Skip reverse foreign keys and many-to-many reverse relations
                        if (
                            hasattr(field, "related_model")
                            and field.many_to_one is False
                            and field.one_to_many is True
                        ):
                            continue

                        field_name = field.name
                        field_type = field.__class__.__name__

                        # Get help text or verbose name
                        if hasattr(field, "help_text") and field.help_text:
                            help_text = strip_tags(force_str(field.help_text))
                        elif hasattr(field, "verbose_name") and field.verbose_name:
                            help_text = force_str(field.verbose_name).capitalize()
                        else:
                            help_text = f"{field_type} field"

                        # Add field choices if they exist
                        if hasattr(field, "choices") and field.choices:
                            choices = [f"'{choice[0]}'" for choice in field.choices]
                            help_text += f" (choices: {', '.join(choices)})"

                        # Format as parameter
                        lines.append(f":param {field_name}: {help_text}")
                        lines.append(f":type {field_name}: {field_type}")
        except TypeError:
            # Not a proper class or can't check subclass relationship
            pass


# Add custom CSS for better styling and configure Django docstring processing
def setup(app: "Sphinx") -> None:
    """Set up Sphinx configuration with custom CSS and Django model processing."""
    app.add_css_file("custom.css")
    app.connect("autodoc-process-docstring", process_django_model_docstring)
