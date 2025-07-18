"""Reusable validators for content models."""

import os
import re
from typing import Any

from django.core.exceptions import ValidationError

# Valid video file extensions
VALID_VIDEO_EXTENSIONS = [".mov", ".mp4", ".webm"]

# Hex color regex pattern
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def validate_video_file_extension(value: Any) -> None:
    """Validate that the uploaded file is a supported video format."""
    ext = os.path.splitext(value.name)[1].lower()

    if ext not in VALID_VIDEO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file extension {ext}. "
            f'Allowed extensions: {", ".join(VALID_VIDEO_EXTENSIONS)}',
        )


def validate_hex_color(value: str) -> None:
    """Validate that the value is a valid hex color code."""
    if not HEX_COLOR_PATTERN.match(value):
        raise ValidationError(
            f"'{value}' is not a valid hex color code. "
            "Must be in format #RRGGBB (e.g., #000000)",
        )
