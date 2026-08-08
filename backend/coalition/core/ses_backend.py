"""
Email backend that delivers through the Amazon SES API.

Lambda runs in private subnets with no internet egress, so SES SMTP
(``email-smtp.<region>.amazonaws.com:587``) is unreachable. The SES API is
reachable over the ``com.amazonaws.<region>.email`` interface endpoint and
authenticates with the function's execution role, so no static SMTP
credentials are needed.
"""

import logging
from collections.abc import Sequence
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage

logger = logging.getLogger(__name__)

# Bounded so a hung SES call cannot consume the whole Lambda timeout.
_CONNECT_TIMEOUT_SECONDS = 5
_READ_TIMEOUT_SECONDS = 10
_MAX_ATTEMPTS = 3


class SESEmailBackend(BaseEmailBackend):
    """Send mail via the SES v2 API using the ambient AWS credentials.

    Delivery failures are raised unless the caller opted into
    ``fail_silently``; a swallowed failure is indistinguishable from a
    delivered verification email and leaves users permanently stuck.
    """

    def __init__(self, fail_silently: bool = False, **kwargs: Any) -> None:
        # Django's send_mail() always passes username/password; the base class
        # accepts and discards them, which is what SES role auth wants.
        super().__init__(fail_silently=fail_silently, **kwargs)
        self._client: Any | None = None
        self._configuration_set: str = getattr(settings, "SES_CONFIGURATION_SET", "")

    @property
    def client(self) -> Any:
        """Lazily build and reuse one SES client for the process."""
        if self._client is None:
            self._client = boto3.client(
                "sesv2",
                config=Config(
                    connect_timeout=_CONNECT_TIMEOUT_SECONDS,
                    read_timeout=_READ_TIMEOUT_SECONDS,
                    retries={"max_attempts": _MAX_ATTEMPTS, "mode": "standard"},
                ),
            )
        return self._client

    def send_messages(self, email_messages: Sequence[EmailMessage]) -> int:
        """Send each message, returning how many SES accepted."""
        return sum(self._send(message) for message in email_messages)

    def _send(self, message: EmailMessage) -> bool:
        recipients = message.recipients()
        if not recipients:
            return False

        try:
            response = self.client.send_email(**self._build_request(message))
        except (BotoCoreError, ClientError):
            logger.exception(
                "SES delivery failed for %d recipient(s) from %s",
                len(recipients),
                message.from_email,
            )
            if not self.fail_silently:
                raise
            return False

        logger.info(
            "SES accepted message %s for %d recipient(s)",
            response.get("MessageId", "<unknown>"),
            len(recipients),
        )
        return True

    def _build_request(self, message: EmailMessage) -> dict[str, Any]:
        """Build the SendEmail request for one Django message.

        Recipients are passed explicitly rather than parsed from the MIME
        headers so that Bcc addresses are delivered without being disclosed
        in the message itself.
        """
        request: dict[str, Any] = {
            "FromEmailAddress": message.from_email,
            "Destination": {"ToAddresses": list(message.recipients())},
            "Content": {"Raw": {"Data": message.message().as_bytes(linesep="\r\n")}},
        }
        if self._configuration_set:
            request["ConfigurationSetName"] = self._configuration_set
        return request
