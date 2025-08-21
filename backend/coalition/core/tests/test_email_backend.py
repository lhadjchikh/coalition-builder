"""
Tests for the SafeSMTPBackend email backend
"""

import socket
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.core.mail import EmailMessage
from django.test import override_settings

from coalition.core.email_backend import SafeSMTPBackend


class TestSafeSMTPBackend:
    """Test the SafeSMTPBackend class"""

    def test_init_sets_timeout(self) -> None:
        """Test that initialization sets a timeout"""
        backend = SafeSMTPBackend()
        assert backend.timeout == 10

    def test_init_with_custom_timeout(self) -> None:
        """Test initialization with custom timeout"""
        backend = SafeSMTPBackend(timeout=5)
        assert backend.timeout == 5

    def test_send_empty_messages_returns_zero(self) -> None:
        """Test sending empty list of messages returns 0"""
        backend = SafeSMTPBackend()
        result = backend.send_messages([])
        assert result == 0

    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_send_messages_success(self, mock_send: Any) -> None:
        """Test successful sending via SMTP"""
        mock_send.return_value = 1

        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_sock_instance = MagicMock()
            mock_sock_instance.connect_ex.return_value = 0  # Success
            mock_socket.return_value.__enter__.return_value = mock_sock_instance

            result = backend.send_messages([message])

        assert result == 1
        mock_send.assert_called_once()

    def test_send_messages_no_host_falls_back_to_console(self) -> None:
        """Test that missing host falls back to console"""
        backend = SafeSMTPBackend()  # No host/port configured
        backend.host = None

        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once_with([message])

    def test_send_messages_no_port_falls_back_to_console(self) -> None:
        """Test that missing port falls back to console"""
        backend = SafeSMTPBackend(host="smtp.example.com")
        backend.port = None

        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once()

    @override_settings(DEBUG=True)
    def test_send_messages_debug_mode_uses_console(self) -> None:
        """Test that DEBUG mode always uses console"""
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 1
            result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once_with([message])

    def test_send_messages_connection_refused_falls_back(self) -> None:
        """Test fallback when SMTP connection is refused"""
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_sock_instance = MagicMock()
            mock_sock_instance.connect_ex.return_value = 1  # Connection refused
            mock_socket.return_value.__enter__.return_value = mock_sock_instance

            with patch.object(backend.console_backend, "send_messages") as mock_console:
                mock_console.return_value = 1
                result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once()

    def test_send_messages_socket_timeout_falls_back(self) -> None:
        """Test fallback when socket times out"""
        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_socket.side_effect = TimeoutError("Connection timed out")

            with patch.object(backend.console_backend, "send_messages") as mock_console:
                mock_console.return_value = 1
                result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once()

    def test_send_messages_socket_gaierror_falls_back(self) -> None:
        """Test fallback when hostname resolution fails"""
        backend = SafeSMTPBackend(host="invalid.hostname.local", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_socket.side_effect = socket.gaierror("Name resolution failed")

            with patch.object(backend.console_backend, "send_messages") as mock_console:
                mock_console.return_value = 1
                result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once()

    @override_settings(DEBUG=True)
    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_send_messages_smtp_exception_falls_back(self, mock_send: Any) -> None:
        """Test fallback when SMTP sending fails in DEBUG mode"""
        mock_send.side_effect = Exception("SMTP Error")

        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_sock_instance = MagicMock()
            mock_sock_instance.connect_ex.return_value = 0  # Connection OK
            mock_socket.return_value.__enter__.return_value = mock_sock_instance

            with patch.object(backend.console_backend, "send_messages") as mock_console:
                mock_console.return_value = 1
                result = backend.send_messages([message])

        assert result == 1
        mock_console.assert_called_once()

    @override_settings(DEBUG=False)
    @patch("coalition.core.email_backend.SMTPBackend.send_messages")
    def test_send_messages_smtp_exception_raises_in_production(
        self,
        mock_send: Any,
    ) -> None:
        """Test that SMTP exceptions are raised in production"""
        mock_send.side_effect = Exception("SMTP Error")

        backend = SafeSMTPBackend(host="smtp.example.com", port=587)
        message = EmailMessage("Test", "Body", "from@example.com", ["to@example.com"])

        with patch("socket.socket") as mock_socket:
            mock_sock_instance = MagicMock()
            mock_sock_instance.connect_ex.return_value = 0  # Connection OK
            mock_socket.return_value.__enter__.return_value = mock_sock_instance

            with pytest.raises(Exception, match="SMTP Error"):
                backend.send_messages([message])

    def test_send_multiple_messages(self) -> None:
        """Test sending multiple messages"""
        backend = SafeSMTPBackend()
        backend.host = None  # Force console backend

        messages = [
            EmailMessage("Test1", "Body1", "from@example.com", ["to1@example.com"]),
            EmailMessage("Test2", "Body2", "from@example.com", ["to2@example.com"]),
        ]

        with patch.object(backend.console_backend, "send_messages") as mock_console:
            mock_console.return_value = 2
            result = backend.send_messages(messages)

        assert result == 2
        mock_console.assert_called_once_with(messages)
