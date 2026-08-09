"""
SMTP email backend that refuses to fail silently
"""

import logging
from collections.abc import Sequence
from typing import Any

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.console import EmailBackend as ConsoleBackend
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
from django.core.mail.message import EmailMessage

logger = logging.getLogger(__name__)


class SafeSMTPBackend(SMTPBackend):
    """SMTP backend that prints to the console in DEBUG and raises otherwise.

    Local development gets console output so it never needs a mail server.
    Everywhere else a delivery failure is raised: reporting success for mail
    that was only written to a log leaves users waiting forever for a
    verification link that will never arrive, and hides the outage from
    monitoring.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("timeout", 10)
        super().__init__(*args, **kwargs)
        self.console_backend = ConsoleBackend()

    def send_messages(self, email_messages: Sequence[EmailMessage]) -> int:
        if not email_messages:
            return 0

        if settings.DEBUG:
            return self.console_backend.send_messages(email_messages)

        self._require_smtp_configuration()

        try:
            return super().send_messages(email_messages)
        except Exception:
            logger.exception(
                "SMTP delivery failed for %d message(s) via %s:%s",
                len(email_messages),
                self.host,
                self.port,
            )
            raise

    def _require_smtp_configuration(self) -> None:
        missing = [
            name
            for name, value in (("EMAIL_HOST", self.host), ("EMAIL_PORT", self.port))
            if not value
        ]
        if missing:
            raise ImproperlyConfigured(
                f"Cannot send email: {' and '.join(missing)} is not configured. "
                "Refusing to discard mail silently outside DEBUG.",
            )
