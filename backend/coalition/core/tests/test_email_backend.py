"""
Tests for the SafeSMTPBackend email backend

The backend deliberately has two modes: in DEBUG it prints to the console so
local development never needs a mail server, and outside DEBUG every failure
is raised so a broken mail path cannot masquerade as a delivered email.
"""

from smtplib import SMTPAuthenticationError, SMTPServerDisconnected
from typing import Any
from unittest.mock import patch

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMessage

from coalition.core.email_backend import SafeSMTPBackend


def make_message() -> EmailMessage:
    return EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])


class TestSafeSMTPBackendConfiguration:
    """Construction and configuration handling"""

    def test_init_sets_default_timeout(self) -> None:
        assert SafeSMTPBackend().timeout == 10

    def test_init_with_custom_timeout(self) -> None:
        assert SafeSMTPBackend(timeout=5).timeout == 5

    def test_send_empty_messages_returns_zero(self) -> None:
        assert SafeSMTPBackend().send_messages([]) == 0


class TestSafeSMTPBackendInDebug:
    """In DEBUG the console stands in for a real mail server"""

    @pytest.fixture(autouse=True)
    def _debug_mode(self, settings: Any) -> None:
        settings.DEBUG = True

    def test_console_is_used_even_when_smtp_is_configured(self) -> None:
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = make_message()

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once_with([message])

    def test_console_is_used_when_smtp_is_not_configured(self) -> None:
        backend = SafeSMTPBackend()
        backend.host = None

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            result = backend.send_messages([make_message()])

        assert result == 1

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_smtp_is_never_attempted(self, mock_send: Any) -> None:
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            backend.send_messages([make_message()])

        mock_send.assert_not_called()

    def test_multiple_messages_go_to_console_together(self) -> None:
        backend = SafeSMTPBackend()
        messages = [make_message(), make_message()]

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 2
            result = backend.send_messages(messages)

        assert result == 2
        mock_console.assert_called_once_with(messages)


class TestSafeSMTPBackendInProduction:
    """Outside DEBUG, mail must be delivered or the failure must be raised"""

    @pytest.fixture(autouse=True)
    def _production_mode(self, settings: Any) -> None:
        settings.DEBUG = False

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_successful_send_returns_count(self, mock_send: Any) -> None:
        mock_send.return_value = 1
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)

        assert backend.send_messages([make_message()]) == 1
        mock_send.assert_called_once()

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_unreachable_server_raises_instead_of_logging_to_console(
        self,
        mock_send: Any,
    ) -> None:
        """The failure mode that silently broke production endorsement email."""
        mock_send.side_effect = SMTPServerDisconnected("Connection unexpectedly closed")
        backend = SafeSMTPBackend(host="email-smtp.us-east-1.amazonaws.com", port=587)

        with (
            patch.object(backend.console_backend, "send_messages") as mock_console,
            pytest.raises(SMTPServerDisconnected),
        ):
            backend.send_messages([make_message()])

        mock_console.assert_not_called()

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_connection_timeout_raises(self, mock_send: Any) -> None:
        mock_send.side_effect = TimeoutError("timed out")
        backend = SafeSMTPBackend(host="email-smtp.us-east-1.amazonaws.com", port=587)

        with pytest.raises(TimeoutError):
            backend.send_messages([make_message()])

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_bad_credentials_raise(self, mock_send: Any) -> None:
        mock_send.side_effect = SMTPAuthenticationError(535, b"Authentication failed")
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)

        with pytest.raises(SMTPAuthenticationError):
            backend.send_messages([make_message()])

    def test_missing_host_raises_rather_than_discarding_mail(self) -> None:
        backend = SafeSMTPBackend()
        backend.host = None

        with pytest.raises(ImproperlyConfigured, match="EMAIL_HOST"):
            backend.send_messages([make_message()])

    def test_missing_port_raises_rather_than_discarding_mail(self) -> None:
        backend = SafeSMTPBackend(host="smtp.example.com")
        backend.port = None

        with pytest.raises(ImproperlyConfigured, match="EMAIL_PORT"):
            backend.send_messages([make_message()])

    def test_empty_messages_still_returns_zero_without_configuration(self) -> None:
        """Nothing to send is not a misconfiguration."""
        backend = SafeSMTPBackend()
        backend.host = None

        assert backend.send_messages([]) == 0
