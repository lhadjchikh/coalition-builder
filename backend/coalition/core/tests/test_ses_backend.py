"""
Tests for the SES API email backend used by Lambda
"""

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError, EndpointConnectionError
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.test import override_settings

from coalition.core.ses_backend import SESEmailBackend


def make_client_error(code: str = "MessageRejected") -> ClientError:
    """Build a realistic SES API error."""
    return ClientError(
        {"Error": {"Code": code, "Message": "Email address is not verified."}},
        "SendEmail",
    )


class TestSESEmailBackend:
    """Test the SESEmailBackend class"""

    @staticmethod
    def make_backend(**kwargs: Any) -> tuple[SESEmailBackend, MagicMock]:
        """Return a backend wired to a mock SES client."""
        backend = SESEmailBackend(**kwargs)
        client = MagicMock()
        client.send_email.return_value = {"MessageId": "0100-abc"}
        backend._client = client
        return backend, client

    def test_send_empty_messages_returns_zero_without_calling_ses(self) -> None:
        backend, client = self.make_backend()

        assert backend.send_messages([]) == 0
        client.send_email.assert_not_called()

    def test_sends_raw_mime_with_subject_and_body(self) -> None:
        backend, client = self.make_backend()
        message = EmailMessage(
            "Verify your endorsement",
            "Click the link",
            "from@landandbay.org",
            ["to@example.com"],
        )

        assert backend.send_messages([message]) == 1

        request = client.send_email.call_args.kwargs
        raw = request["Content"]["Raw"]["Data"].decode()
        assert "Verify your endorsement" in raw
        assert "Click the link" in raw
        assert request["FromEmailAddress"] == "from@landandbay.org"

    def test_destination_carries_every_recipient_including_bcc(self) -> None:
        """Bcc recipients must be delivered without appearing in the headers."""
        backend, client = self.make_backend()
        message = EmailMessage(
            "Subject",
            "Body",
            "from@landandbay.org",
            ["to@example.com"],
            bcc=["hidden@example.com"],
            cc=["cc@example.com"],
        )

        backend.send_messages([message])

        request = client.send_email.call_args.kwargs
        assert set(request["Destination"]["ToAddresses"]) == {
            "to@example.com",
            "cc@example.com",
            "hidden@example.com",
        }
        raw = request["Content"]["Raw"]["Data"].decode()
        assert "hidden@example.com" not in raw

    def test_sends_html_alternative(self) -> None:
        backend, client = self.make_backend()
        message = EmailMultiAlternatives(
            "Subject",
            "Plain body",
            "from@landandbay.org",
            ["to@example.com"],
        )
        message.attach_alternative("<p>HTML body</p>", "text/html")

        backend.send_messages([message])

        raw = client.send_email.call_args.kwargs["Content"]["Raw"]["Data"].decode()
        assert "Plain body" in raw
        assert "<p>HTML body</p>" in raw

    def test_returns_count_of_messages_sent(self) -> None:
        backend, client = self.make_backend()
        messages = [
            EmailMessage("A", "1", "from@landandbay.org", ["a@example.com"]),
            EmailMessage("B", "2", "from@landandbay.org", ["b@example.com"]),
        ]

        assert backend.send_messages(messages) == 2
        assert client.send_email.call_count == 2

    def test_skips_message_with_no_recipients(self) -> None:
        backend, client = self.make_backend()
        message = EmailMessage("Subject", "Body", "from@landandbay.org", [])

        assert backend.send_messages([message]) == 0
        client.send_email.assert_not_called()

    @override_settings(SES_CONFIGURATION_SET="landandbay-config-set")
    def test_includes_configuration_set_when_configured(self) -> None:
        backend, client = self.make_backend()
        message = EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])

        backend.send_messages([message])

        request = client.send_email.call_args.kwargs
        assert request["ConfigurationSetName"] == "landandbay-config-set"

    @override_settings(SES_CONFIGURATION_SET="")
    def test_omits_configuration_set_when_not_configured(self) -> None:
        backend, client = self.make_backend()
        message = EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])

        backend.send_messages([message])

        assert "ConfigurationSetName" not in client.send_email.call_args.kwargs

    def test_ses_rejection_raises_when_not_fail_silently(self) -> None:
        """A rejected send must surface, never be reported as delivered."""
        backend, client = self.make_backend(fail_silently=False)
        client.send_email.side_effect = make_client_error()
        message = EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])

        with pytest.raises(ClientError):
            backend.send_messages([message])

    def test_unreachable_endpoint_raises_when_not_fail_silently(self) -> None:
        """No network path to SES must fail loudly rather than look successful."""
        backend, client = self.make_backend(fail_silently=False)
        client.send_email.side_effect = EndpointConnectionError(
            endpoint_url="https://email.us-east-1.amazonaws.com/",
        )
        message = EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])

        with pytest.raises(EndpointConnectionError):
            backend.send_messages([message])

    def test_ses_rejection_returns_zero_when_fail_silently(self) -> None:
        backend, client = self.make_backend(fail_silently=True)
        client.send_email.side_effect = make_client_error()
        message = EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])

        assert backend.send_messages([message]) == 0

    def test_failure_of_one_message_does_not_hide_the_rest(self) -> None:
        backend, client = self.make_backend(fail_silently=True)
        client.send_email.side_effect = [
            {"MessageId": "0100-ok"},
            make_client_error(),
        ]
        messages = [
            EmailMessage("A", "1", "from@landandbay.org", ["a@example.com"]),
            EmailMessage("B", "2", "from@landandbay.org", ["b@example.com"]),
        ]

        assert backend.send_messages(messages) == 1

    def test_reuses_one_client_across_messages(self) -> None:
        messages = [
            EmailMessage("A", "1", "from@landandbay.org", ["a@example.com"]),
            EmailMessage("B", "2", "from@landandbay.org", ["b@example.com"]),
        ]

        with patch("coalition.core.ses_backend.boto3.client") as mock_client:
            backend = SESEmailBackend()
            backend.send_messages(messages)
            backend.send_messages(messages)

        assert mock_client.call_count == 1

    def test_client_uses_sesv2_with_bounded_timeouts(self) -> None:
        """Two sequential sends must leave time for the transaction to commit."""
        with patch("coalition.core.ses_backend.boto3.client") as mock_client:
            backend = SESEmailBackend()
            backend.send_messages(
                [EmailMessage("S", "B", "from@landandbay.org", ["to@example.com"])],
            )

        (service,) = mock_client.call_args.args
        assert service == "sesv2"
        config = mock_client.call_args.kwargs["config"]
        assert config.retries["total_max_attempts"] == 1
        assert "max_attempts" not in config.retries
        assert config.connect_timeout + config.read_timeout < 10
