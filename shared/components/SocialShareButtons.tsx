import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faLinkedin,
  faBluesky,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faLink, faCheck } from "@fortawesome/free-solid-svg-icons";
import analytics from "@shared/services/analytics";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  campaignName?: string;
  className?: string;
  showLabel?: boolean;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  title,
  description = "",
  hashtags = [],
  campaignName = "",
  className = "",
  showLabel = true,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Encode text for URLs
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(url);
  const hashtagString = hashtags.length > 0 ? hashtags.join(",") : "";

  // Platform-specific share URLs
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${
      hashtagString ? `&hashtags=${hashtagString}` : ""
    }`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    bluesky: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: string) => {
    // Track share event
    analytics.trackEvent({
      action: "share_click",
      category: "social_share",
      label: `${platform}_${campaignName || "campaign"}`,
    });

    if (platform === "copy") {
      handleCopyLink();
    } else {
      // Open share window
      const shareUrl = shareUrls[platform as keyof typeof shareUrls];
      if (shareUrl) {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      // Try using the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          // Note: document.execCommand is deprecated but still needed for older browsers
          const successful = document.execCommand("copy");
          if (successful) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } else {
            // Inform user that copy failed - they can manually copy the URL
            console.warn("Unable to copy to clipboard. Please copy the link manually.");
          }
        } catch (err) {
          console.error("Failed to copy link. Browser may not support automatic copying:", err);
          // Could show a user-friendly message here if needed
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className={`social-share-buttons ${className}`}>
      {showLabel && <p className="share-label">Share this campaign:</p>}

      <div className="share-buttons-container">
        {/* Facebook */}
        <button
          className="share-button share-facebook"
          onClick={() => handleShare("facebook")}
          aria-label="Share on Facebook"
          title="Share on Facebook"
        >
          <FontAwesomeIcon icon={faFacebook} size="lg" />
          <span className="share-button-label">Facebook</span>
        </button>

        {/* LinkedIn */}
        <button
          className="share-button share-linkedin"
          onClick={() => handleShare("linkedin")}
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
        >
          <FontAwesomeIcon icon={faLinkedin} size="lg" />
          <span className="share-button-label">LinkedIn</span>
        </button>

        {/* BlueSky */}
        <button
          className="share-button share-bluesky"
          onClick={() => handleShare("bluesky")}
          aria-label="Share on BlueSky"
          title="Share on BlueSky"
        >
          <FontAwesomeIcon icon={faBluesky} size="lg" />
          <span className="share-button-label">BlueSky</span>
        </button>

        {/* X (Twitter) */}
        <button
          className="share-button share-twitter"
          onClick={() => handleShare("twitter")}
          aria-label="Share on X"
          title="Share on X (formerly Twitter)"
        >
          <FontAwesomeIcon icon={faXTwitter} size="lg" />
          <span className="share-button-label">X</span>
        </button>

        {/* Email */}
        <button
          className="share-button share-email"
          onClick={() => handleShare("email")}
          aria-label="Share via Email"
          title="Share via Email"
        >
          <FontAwesomeIcon icon={faEnvelope} size="lg" />
          <span className="share-button-label">Email</span>
        </button>

        {/* Copy Link */}
        <button
          className="share-button share-copy"
          onClick={() => handleShare("copy")}
          aria-label="Copy link"
          title={copySuccess ? "Copied!" : "Copy link"}
          data-copied={copySuccess.toString()}
        >
          <FontAwesomeIcon icon={copySuccess ? faCheck : faLink} size="lg" />
          <span className="share-button-label">
            {copySuccess ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;
