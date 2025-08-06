import React, { useState } from "react";
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
          document.execCommand("copy");
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
          console.error("Failed to copy link:", err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Try to use native Web Share API if available (mobile)
  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
        analytics.trackEvent({
          action: "share_native",
          category: "social_share",
          label: campaignName || title,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", err);
      }
    }
  };

  return (
    <div className={`social-share-buttons ${className}`}>
      {showLabel && <p className="share-label">Share this campaign:</p>}

      <div className="share-buttons-container">
        {/* Native share button for mobile */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            className="share-button share-native"
            onClick={handleNativeShare}
            aria-label="Share"
            title="Share"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span className="share-button-label">Share</span>
          </button>
        )}

        {/* Facebook */}
        <button
          className="share-button share-facebook"
          onClick={() => handleShare("facebook")}
          aria-label="Share on Facebook"
          title="Share on Facebook"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="share-button-label">Facebook</span>
        </button>

        {/* LinkedIn */}
        <button
          className="share-button share-linkedin"
          onClick={() => handleShare("linkedin")}
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="share-button-label">LinkedIn</span>
        </button>

        {/* BlueSky */}
        <button
          className="share-button share-bluesky"
          onClick={() => handleShare("bluesky")}
          aria-label="Share on BlueSky"
          title="Share on BlueSky"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565C.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479c.815 2.736 3.713 3.66 6.383 3.364c.136-.02.275-.039.415-.056c-.138.022-.276.04-.415.056c-3.912.58-7.387 2.005-2.83 7.078c5.013 5.19 6.87-1.113 7.823-4.308c.953 3.195 2.05 9.271 7.733 4.308c4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056c2.67.297 5.568-.628 6.383-3.364c.246-.828.624-5.79.624-6.478c0-.69-.139-1.861-.902-2.206c-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8" />
          </svg>
          <span className="share-button-label">BlueSky</span>
        </button>

        {/* X (Twitter) */}
        <button
          className="share-button share-twitter"
          onClick={() => handleShare("twitter")}
          aria-label="Share on X"
          title="Share on X (formerly Twitter)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="share-button-label">X</span>
        </button>

        {/* Email */}
        <button
          className="share-button share-email"
          onClick={() => handleShare("email")}
          aria-label="Share via Email"
          title="Share via Email"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 5L2 7" />
          </svg>
          <span className="share-button-label">Email</span>
        </button>

        {/* Copy Link */}
        <button
          className="share-button share-copy"
          onClick={() => handleShare("copy")}
          aria-label="Copy link"
          title={copySuccess ? "Copied!" : "Copy link"}
        >
          {copySuccess ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span className="share-button-label">
            {copySuccess ? "Copied!" : "Copy"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;
