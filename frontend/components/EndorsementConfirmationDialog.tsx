import React, { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { Campaign } from "../types/index";
import SocialShareButtons from "./SocialShareButtons";

interface EndorsementConfirmationDialogProps {
  campaign: Campaign;
  email: string;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

const EndorsementConfirmationDialog: React.FC<
  EndorsementConfirmationDialogProps
> = ({ campaign, email, onClose, returnFocusTo }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocusedElement = returnFocusTo ?? document.activeElement;

    dialog?.showModal();

    return () => {
      if (dialog?.open) {
        dialog.close();
      }

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [returnFocusTo]);

  const closeOnCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const requestAnotherVerificationEmail = async () => {
    setResendState("sending");
    try {
      await API.resendEndorsementVerification(email, campaign.id);
      setResendState("sent");
    } catch {
      setResendState("failed");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="success-message confirmation-dialog"
      data-testid="success-message"
      aria-labelledby="endorsement-confirmation-title"
      onCancel={closeOnCancel}
    >
      <button
        type="button"
        className="confirmation-dialog-close"
        aria-label="Close confirmation"
        onClick={onClose}
        autoFocus
      >
        ×
      </button>
      <h3 id="endorsement-confirmation-title">
        Thank you for your endorsement!
      </h3>
      <p>
        Check your email and click the verification link. Verifying your email
        completes your submission.
      </p>
      <p>
        If the email does not arrive, you can request another copy without
        submitting the form again.
      </p>
      <button
        type="button"
        className="confirmation-resend-button"
        disabled={resendState === "sending" || resendState === "sent"}
        onClick={requestAnotherVerificationEmail}
      >
        {resendState === "sending"
          ? "Requesting verification email…"
          : "Send another verification email"}
      </button>
      {resendState === "sent" && (
        <p role="status">Another verification email has been requested.</p>
      )}
      {resendState === "failed" && (
        <p role="alert">
          We could not request another email. Please try again later.
        </p>
      )}

      <div className="share-endorsement-section">
        <p className="share-cta">
          Help amplify your support by sharing this campaign:
        </p>
        <SocialShareButtons
          url={`${window.location.origin}/campaigns/${campaign.name}`}
          title={`I just endorsed ${campaign.title}!`}
          description={`Join me in supporting this important initiative: ${
            campaign.summary || campaign.description
          }`}
          hashtags={[
            "PolicyChange",
            "CivicEngagement",
            campaign.name?.replace(/-/g, "") || "",
          ]}
          campaignName={campaign.name}
          showLabel={false}
        />
      </div>
    </dialog>
  );
};

export default EndorsementConfirmationDialog;
