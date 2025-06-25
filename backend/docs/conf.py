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


# Add custom CSS for better styling
def setup(app: "Sphinx") -> None:
    """Set up Sphinx configuration with custom CSS."""
    app.add_css_file("custom.css")
