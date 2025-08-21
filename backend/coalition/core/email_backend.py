"""
Custom email backend with fallback for development and error handling
"""

import logging
import socket
from collections.abc import Sequence
from typing import Any

from django.conf import settings
from django.core.mail.backends.console import EmailBackend as ConsoleBackend
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
from django.core.mail.message import EmailMessage

logger = logging.getLogger(__name__)


class SafeSMTPBackend(SMTPBackend):
    """
    SMTP backend that falls back to console output if SMTP is not configured
    or connection fails. This is useful for development and prevents the
    application from hanging when email is not properly configured.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # Override timeout to be shorter (10 seconds instead of default)
        kwargs.setdefault("timeout", 10)
        super().__init__(*args, **kwargs)
        self.console_backend = ConsoleBackend()

    def send_messages(self, email_messages: Sequence[EmailMessage]) -> int:
        """
        Try to send via SMTP, fall back to console if it fails
        """
        if not email_messages:
            return 0

        # Check if SMTP is configured
        if not self.host or not self.port:
            logger.warning(
                "SMTP not configured (missing host/port), logging emails to console. "
                "Configure EMAIL_HOST and EMAIL_PORT environment variables.",
            )
            return self.console_backend.send_messages(email_messages)

        # In debug mode, always use console
        if settings.DEBUG:
            return self.console_backend.send_messages(email_messages)

        try:
            # Try to connect with a short timeout
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(3)  # 3 second timeout for connection test
                result = sock.connect_ex((self.host, self.port))
                if result != 0:
                    logger.warning(
                        f"Cannot connect to SMTP server {self.host}:{self.port}, "
                        "logging emails to console instead.",
                    )
                    return self.console_backend.send_messages(email_messages)
        except (TimeoutError, socket.gaierror, OSError) as e:
            logger.warning(
                f"SMTP connection test failed: {e}, logging emails to console",
            )
            return self.console_backend.send_messages(email_messages)

        # Try to send via SMTP
        try:
            return super().send_messages(email_messages)
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            # In production, raise the exception to avoid silent failure
            # In development/testing, fall back to console
            if not settings.DEBUG and not getattr(settings, "TESTING", False):
                raise
            logger.info("Falling back to console email output")
            return self.console_backend.send_messages(email_messages)
