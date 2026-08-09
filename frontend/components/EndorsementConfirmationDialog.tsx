import React, { useEffect, useRef } from "react";
import { Campaign } from "../types/index";
import SocialShareButtons from "./SocialShareButtons";

interface EndorsementConfirmationDialogProps {
  campaign: Campaign;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}

const EndorsementConfirmationDialog: React.FC<
  EndorsementConfirmationDialogProps
> = ({ campaign, onClose, returnFocusTo }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
        Check your email and click the verification link. Your endorsement will
        be sent for review after you verify it.
      </p>

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
