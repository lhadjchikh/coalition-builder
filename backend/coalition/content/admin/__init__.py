"""Content admin package."""

from .content_block import ContentBlockAdmin
from .homepage import HomePageAdmin
from .image import ImageAdmin
from .person import PersonAdmin
from .person_group import PersonGroupAdmin
from .theme import ThemeAdmin
from .video import VideoAdmin

__all__ = [
    "ContentBlockAdmin",
    "HomePageAdmin",
    "ImageAdmin",
    "PersonAdmin",
    "PersonGroupAdmin",
    "ThemeAdmin",
    "VideoAdmin",
]
