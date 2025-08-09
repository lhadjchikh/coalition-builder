/**
 * @jest-environment jsdom
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SocialShareButtons from "../SocialShareButtons";
import analytics from "../../services/analytics";

// Mock FontAwesome icons
jest.mock("@fortawesome/free-brands-svg-icons", () => ({
  faFacebook: { iconName: "facebook", prefix: "fab" },
  faLinkedin: { iconName: "linkedin", prefix: "fab" },
  faBluesky: { iconName: "bluesky", prefix: "fab" },
  faXTwitter: { iconName: "x-twitter", prefix: "fab" },
}));

jest.mock("@fortawesome/free-solid-svg-icons", () => ({
  faEnvelope: { iconName: "envelope", prefix: "fas" },
  faLink: { iconName: "link", prefix: "fas" },
  faCheck: { iconName: "check", prefix: "fas" },
}));

// Mock FontAwesomeIcon component
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({
    icon,
    ...props
  }: {
    icon: { iconName?: string };
    [key: string]: unknown;
  }) => {
    const iconName = icon.iconName || "unknown";
    return <span data-testid={`icon-${iconName}`} {...props} />;
  },
}));

// Mock analytics
jest.mock("../../services/analytics", () => {
  const mockTrackEvent = jest.fn();
  return {
    __esModule: true,
    default: {
      trackEvent: mockTrackEvent,
      isInitialized: true,
      isAnalyticsEnabled: () => true,
      getTrackingId: () => "test-tracking-id",
      initialize: jest.fn(),
      trackPageView: jest.fn(),
      trackNavigation: jest.fn(),
      trackEndorsementSubmission: jest.fn(),
      trackCampaignView: jest.fn(),
      trackLegalDocumentView: jest.fn(),
      trackFormInteraction: jest.fn(),
      onConsentChange: jest.fn(),
      _resetForTesting: jest.fn(),
    },
    analytics: {
      trackEvent: mockTrackEvent,
    },
    mockTrackEvent,
  };
});

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.isSecureContext
Object.defineProperty(window, "isSecureContext", {
  writable: true,
  value: true,
});

// Mock window.location - use original method but suppress navigation warnings
const originalWarn = console.error;
console.error = (...args: unknown[]) => {
  if (
    args[0] &&
    typeof args[0] === "object" &&
    args[0].message &&
    args[0].message.includes("Not implemented: navigation")
  ) {
    return; // Suppress JSDOM navigation warnings
  }
  if (
    typeof args[0] === "string" &&
    args[0].includes("Not implemented: navigation")
  ) {
    return; // Suppress JSDOM navigation warnings
  }
  originalWarn(...args);
};

// Mock window.location
delete (window as typeof window & { location?: Location }).location;
window.location = { origin: "http://localhost:3000" } as Location;

describe("SocialShareButtons", () => {
  const defaultProps = {
    url: "http://example.com/campaign",
    title: "Test Campaign",
    description: "Test Description",
    hashtags: ["test", "campaign"],
    campaignName: "test-campaign",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
    (analytics.trackEvent as jest.Mock)?.mockClear();
  });

  describe("Rendering", () => {
    it("renders all social share buttons", () => {
      render(<SocialShareButtons {...defaultProps} />);

      expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on LinkedIn")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on BlueSky")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on X")).toBeInTheDocument();
      expect(screen.getByLabelText("Share via Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Copy link")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      const { container } = render(
        <SocialShareButtons {...defaultProps} className="custom-class" />,
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("shows label when showLabel is true", () => {
      render(<SocialShareButtons {...defaultProps} showLabel={true} />);

      expect(screen.getByText("Share this campaign:")).toBeInTheDocument();
    });

    it("hides label when showLabel is false", () => {
      render(<SocialShareButtons {...defaultProps} showLabel={false} />);

      expect(
        screen.queryByText("Share this campaign:"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Social Platform Sharing", () => {
    it("opens Facebook share dialog", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText("Share on Facebook");
      fireEvent.click(facebookButton);

      expect(mockOpen).toHaveBeenCalledWith(
        "https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fexample.com%2Fcampaign",
        "_blank",
        "width=600,height=400",
      );
    });

    it("opens LinkedIn share dialog", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedinButton = screen.getByLabelText("Share on LinkedIn");
      fireEvent.click(linkedinButton);

      expect(mockOpen).toHaveBeenCalledWith(
        "https://www.linkedin.com/sharing/share-offsite/?url=http%3A%2F%2Fexample.com%2Fcampaign",
        "_blank",
        "width=600,height=400",
      );
    });

    it("opens BlueSky share dialog", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const blueskyButton = screen.getByLabelText("Share on BlueSky");
      fireEvent.click(blueskyButton);

      expect(mockOpen).toHaveBeenCalledWith(
        "https://bsky.app/intent/compose?text=Test%20Campaign%20http%3A%2F%2Fexample.com%2Fcampaign",
        "_blank",
        "width=600,height=400",
      );
    });

    it("opens X (Twitter) share dialog with hashtags", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const twitterButton = screen.getByLabelText("Share on X");
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        "https://twitter.com/intent/tweet?text=Test%20Campaign&url=http%3A%2F%2Fexample.com%2Fcampaign&hashtags=test,campaign",
        "_blank",
        "width=600,height=400",
      );
    });

    it("opens email client", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const emailButton = screen.getByLabelText("Share via Email");
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        "mailto:?subject=Test%20Campaign&body=Test%20Description%0A%0Ahttp%3A%2F%2Fexample.com%2Fcampaign",
        "_blank",
        "width=600,height=400",
      );
    });
  });

  describe("Copy Link Functionality", () => {
    it("copies link to clipboard using modern API", async () => {
      // Ensure we're in a secure context with clipboard API
      window.isSecureContext = true;
      mockWriteText.mockResolvedValueOnce(undefined);

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Wait for the promise to resolve
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "http://example.com/campaign",
        );
      });
    });

    it("shows success state after copying", async () => {
      // Ensure we're in a secure context with clipboard API
      window.isSecureContext = true;
      mockWriteText.mockResolvedValueOnce(undefined);

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Wait for the success state to appear
      await waitFor(
        () => {
          expect(screen.getByText("Copied!")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that the button attributes reflect the copied state
      await waitFor(
        () => {
          expect(copyButton).toHaveAttribute("data-copied", "true");
          expect(copyButton).toHaveAttribute("title", "Copied!");
        },
        { timeout: 3000 },
      );
    });

    it("reverts to original state after 2 seconds", async () => {
      jest.useFakeTimers();

      // Ensure we're in a secure context with clipboard API
      window.isSecureContext = true;
      mockWriteText.mockResolvedValueOnce(undefined);

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Wait for the copied state
      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-copied", "true");
      });

      // Advance timers to trigger the reset
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for the state to revert
      await waitFor(() => {
        expect(screen.getByText("Copy")).toBeInTheDocument();
        expect(copyButton).toHaveAttribute("data-copied", "false");
        expect(copyButton).toHaveAttribute("title", "Copy link");
      });

      jest.useRealTimers();
    });

    it("handles clipboard API failure gracefully", async () => {
      // Ensure we're in a secure context
      window.isSecureContext = true;
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to copy link:",
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it("falls back to execCommand when clipboard API is not available", async () => {
      // Store original clipboard API
      const originalClipboard = navigator.clipboard;
      const originalIsSecureContext = window.isSecureContext;

      // Remove clipboard API
      delete (navigator as typeof navigator & { clipboard?: Clipboard })
        .clipboard;
      window.isSecureContext = false;

      const mockExecCommand = jest.fn(() => true);
      document.execCommand = mockExecCommand;

      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockExecCommand).toHaveBeenCalledWith("copy");

      // Restore clipboard API
      Object.assign(navigator, {
        clipboard: originalClipboard,
      });
      window.isSecureContext = originalIsSecureContext;
    });
  });

  describe("Analytics Tracking", () => {
    it("tracks Facebook share click", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const facebookButton = screen.getByLabelText("Share on Facebook");
      fireEvent.click(facebookButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: "share_click",
        category: "social_share",
        label: "facebook_test-campaign",
      });
    });

    it("tracks LinkedIn share click", () => {
      render(<SocialShareButtons {...defaultProps} />);

      const linkedinButton = screen.getByLabelText("Share on LinkedIn");
      fireEvent.click(linkedinButton);

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: "share_click",
        category: "social_share",
        label: "linkedin_test-campaign",
      });
    });

    it("tracks copy link action", async () => {
      render(<SocialShareButtons {...defaultProps} />);

      const copyButton = screen.getByLabelText("Copy link");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith({
        action: "share_click",
        category: "social_share",
        label: "copy_test-campaign",
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined description", () => {
      const props = { ...defaultProps, description: undefined };
      render(<SocialShareButtons {...props} />);

      const emailButton = screen.getByLabelText("Share via Email");
      fireEvent.click(emailButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("body=%0A%0A"),
        "_blank",
        "width=600,height=400",
      );
    });

    it("handles empty hashtags array", () => {
      const props = { ...defaultProps, hashtags: [] };
      render(<SocialShareButtons {...props} />);

      const twitterButton = screen.getByLabelText("Share on X");
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.not.stringContaining("hashtags="),
        "_blank",
        "width=600,height=400",
      );
    });

    it("handles special characters in title and description", () => {
      const props = {
        ...defaultProps,
        title: "Test & Campaign <special>",
        description: 'Description with "quotes" and & symbols',
      };

      render(<SocialShareButtons {...props} />);

      const twitterButton = screen.getByLabelText("Share on X");
      fireEvent.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining("Test%20%26%20Campaign%20%3Cspecial%3E"),
        "_blank",
        "width=600,height=400",
      );
    });
  });
});

// Restore console.error after all tests
afterAll(() => {
  console.error = originalWarn;
});
