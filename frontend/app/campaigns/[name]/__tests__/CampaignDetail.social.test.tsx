import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CampaignDetail from "../../../../components/CampaignDetail";
import { apiClient } from "../../../../lib/api";

// Mock apiClient
jest.mock("../../../../lib/api", () => ({
  __esModule: true,
  ssrApiClient: {
    getHomepage: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    getCampaignByName: jest.fn(),
    getCampaign: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getEndorsements: jest.fn(),
    getCampaignEndorsements: jest.fn(),
    createEndorsement: jest.fn(),
    getHomepageById: jest.fn(),
    getContentBlocks: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
    getContentBlocksByHomepageId: jest.fn(),
    getContentBlock: jest.fn(),
    getTermsOfUse: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    healthCheck: jest.fn(),
  },
  apiClient: {
    getHomepage: jest.fn(),
    getCampaignByName: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    getCampaign: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getEndorsements: jest.fn(),
    getCampaignEndorsements: jest.fn(),
    createEndorsement: jest.fn(),
    getHomepageById: jest.fn(),
    getContentBlocks: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
    getContentBlocksByHomepageId: jest.fn(),
    getContentBlock: jest.fn(),
    getTermsOfUse: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    healthCheck: jest.fn(),
  },
}));
jest.mock("../../../../services/analytics");

// Suppress JSDOM navigation warnings
const originalError = console.error;
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
  originalError(...args);
};

// Don't mock CampaignDetail - test the real component with social features

// Setup window.location mock
const createLocationMock = (origin: string = "http://localhost:3000") => ({
  origin,
  href: `${origin}/campaigns/clean-water`,
  pathname: "/campaigns/clean-water",
});

// Mock window.location for all tests
delete (window as typeof window & { location?: Location }).location;
(window as typeof window & { location: Location }).location =
  createLocationMock();

jest.mock("../../../../components/Navbar", () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock("../../../../components/Footer", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock any responsive behavior by setting window.innerWidth
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 375, // Mobile width
});

// Mock SocialShareButtons but keep it testable
jest.mock("../../../../components/SocialShareButtons", () => {
  return function MockSocialShareButtons(props: {
    url?: string;
    title?: string;
    description?: string;
    hashtags?: string[];
    campaignName?: string;
    showLabel?: boolean;
    className?: string;
  }) {
    return (
      <div data-testid="social-share-buttons" className={props.className}>
        <div data-testid="share-url">{props.url}</div>
        <div data-testid="share-title">{props.title}</div>
        <div data-testid="share-description">{props.description}</div>
        <div data-testid="share-hashtags">{props.hashtags?.join(",")}</div>
        <div data-testid="share-campaign-name">{props.campaignName}</div>
        <div data-testid="share-show-label">{props.showLabel?.toString()}</div>
      </div>
    );
  };
});

// Mock other components used in CampaignDetail
jest.mock("../../../../components/EndorsementForm", () => ({
  __esModule: true,
  default: () => <div data-testid="endorsement-form">Endorsement Form</div>,
}));

jest.mock("../../../../components/EndorsementsList", () => ({
  __esModule: true,
  default: () => <div data-testid="endorsements-list">Endorsements List</div>,
}));

jest.mock("../../../../components/GrowthIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="growth-icon">Growth Icon</div>,
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ name: "clean-water" }),
  usePathname: () => "/campaigns/clean-water",
}));

describe("CampaignDetail Social Sharing Features", () => {
  const mockCampaign = {
    id: 1,
    name: "clean-water",
    title: "Clean Water Initiative",
    summary: "Ensuring access to clean water for all communities",
    description: "Detailed description of the clean water initiative...",
    image_url: "https://example.com/water.jpg",
    image_alt_text: "Clean water flowing",
    endorsement_statement: "I support clean water access",
    allow_endorsements: true,
    endorsement_form_instructions: "Please fill out all fields",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
  };

  const mockHomepage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Working together",
    hero_title: "Welcome",
    hero_subtitle: "Making a difference",
    hero_background_image_url: "",
    cta_title: "Join Us",
    cta_content: "Be part of the change",
    cta_button_text: "Get Started",
    cta_button_url: "/contact",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Our Campaigns",
    campaigns_section_subtitle: "",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(mockCampaign);
    (apiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Reset window.location mock only if window is available
    if (typeof window !== "undefined") {
      (window as typeof window & { location: Location }).location =
        createLocationMock();
    }
  });

  describe("Social Share Section", () => {
    it("renders social share section after campaign loads", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      });

      // Check that the share button is present on the hero image
      expect(screen.getByLabelText("Share this campaign")).toBeInTheDocument();

      // Click the share button to open the modal
      fireEvent.click(screen.getByLabelText("Share this campaign"));

      // Check that the modal and social share buttons appear
      expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
    });

    it("passes correct props to SocialShareButtons in share modal", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      });

      // Click the share button to open the modal
      fireEvent.click(screen.getByLabelText("Share this campaign"));

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      // Check props passed to the modal share buttons
      const shareButtons = screen.getByTestId("social-share-buttons");
      const urlElement = shareButtons.querySelector(
        '[data-testid="share-url"]'
      );
      const titleElement = shareButtons.querySelector(
        '[data-testid="share-title"]'
      );
      const descriptionElement = shareButtons.querySelector(
        '[data-testid="share-description"]'
      );
      const hashtagsElement = shareButtons.querySelector(
        '[data-testid="share-hashtags"]'
      );
      const campaignNameElement = shareButtons.querySelector(
        '[data-testid="share-campaign-name"]'
      );
      const showLabelElement = shareButtons.querySelector(
        '[data-testid="share-show-label"]'
      );

      expect(urlElement?.textContent).toContain("/campaigns/clean-water");
      expect(titleElement?.textContent).toBe(mockCampaign.title);
      expect(descriptionElement?.textContent).toBe(mockCampaign.summary);
      expect(hashtagsElement?.textContent).toContain("PolicyChange");
      expect(hashtagsElement?.textContent).toContain("CivicEngagement");
      expect(hashtagsElement?.textContent).toContain("cleanwater"); // name with hyphens removed
      expect(campaignNameElement?.textContent).toBe(mockCampaign.name);
      expect(showLabelElement?.textContent).toBe("false");
    });

    it("uses campaign description as fallback when summary is not available", async () => {
      const campaignWithoutSummary = { ...mockCampaign, summary: null };
      (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(
        campaignWithoutSummary
      );

      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      });

      // Click the share button to open the modal
      fireEvent.click(screen.getByLabelText("Share this campaign"));

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      const shareButtons = screen.getByTestId("social-share-buttons");
      const descriptionElement = shareButtons.querySelector(
        '[data-testid="share-description"]'
      );
      expect(descriptionElement?.textContent).toBe(mockCampaign.description);
    });
  });

  describe("Share Modal Functionality", () => {
    it("shows share button on hero image when image is present", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText("Share this campaign")
        ).toBeInTheDocument();
      });

      const shareButton = screen.getByLabelText("Share this campaign");
      expect(shareButton).toHaveClass("absolute", "top-4", "right-4");
    });

    it("opens share modal when share button is clicked", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText("Share this campaign")
        ).toBeInTheDocument();
      });

      const shareButton = screen.getByLabelText("Share this campaign");
      fireEvent.click(shareButton);

      // Should show the modal
      expect(screen.getByText("Spread the Word")).toBeInTheDocument();
      expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
    });

    it("closes share modal when close button is clicked", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText("Share this campaign")
        ).toBeInTheDocument();
      });

      // Open the modal
      const shareButton = screen.getByLabelText("Share this campaign");
      fireEvent.click(shareButton);

      expect(screen.getByText("Spread the Word")).toBeInTheDocument();

      // Close the modal
      const closeButton = screen.getByLabelText("Close share modal");
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText("Spread the Word")).not.toBeInTheDocument();
    });

    it("passes correct props to modal share buttons", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText("Share this campaign")
        ).toBeInTheDocument();
      });

      const shareButton = screen.getByLabelText("Share this campaign");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      const shareButtons = screen.getByTestId("social-share-buttons");

      const urlElement = shareButtons.querySelector(
        '[data-testid="share-url"]'
      );
      const titleElement = shareButtons.querySelector(
        '[data-testid="share-title"]'
      );
      const campaignNameElement = shareButtons.querySelector(
        '[data-testid="share-campaign-name"]'
      );

      expect(urlElement?.textContent).toContain("/campaigns/clean-water");
      expect(titleElement?.textContent).toBe(mockCampaign.title);
      expect(campaignNameElement?.textContent).toBe(mockCampaign.name);
    });
  });

  describe("Error Handling", () => {
    it("does not render share button when campaign fails to load", async () => {
      (apiClient.getCampaignByName as jest.Mock).mockRejectedValue(
        new Error("Failed to load")
      );

      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading campaign/)).toBeInTheDocument();
      });

      expect(
        screen.queryByLabelText("Share this campaign")
      ).not.toBeInTheDocument();
    });

    it("does not render share button when campaign is not found", async () => {
      (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(null);

      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Campaign not found/)).toBeInTheDocument();
      });

      expect(
        screen.queryByLabelText("Share this campaign")
      ).not.toBeInTheDocument();
    });
  });

  describe("Integration with Campaign Data", () => {
    it("handles special characters in campaign name for hashtags", async () => {
      const campaignWithSpecialName = {
        ...mockCampaign,
        name: "clean-water-2024",
      };
      (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(
        campaignWithSpecialName
      );

      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      });

      // Click the share button to open the modal
      fireEvent.click(screen.getByLabelText("Share this campaign"));

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      const shareButtons = screen.getByTestId("social-share-buttons");
      const hashtagsElement = shareButtons.querySelector(
        '[data-testid="share-hashtags"]'
      );

      // Hyphens should be removed from the campaign name in hashtags
      expect(hashtagsElement?.textContent).toContain("cleanwater2024");
    });

    it("generates correct share URL based on campaign name", async () => {
      render(
        <CampaignDetail campaignName="clean-water" apiClient={apiClient} />
      );

      await waitFor(() => {
        expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      });

      // Click the share button to open the modal
      fireEvent.click(screen.getByLabelText("Share this campaign"));

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      const shareButtons = screen.getByTestId("social-share-buttons");
      const urlElement = shareButtons.querySelector(
        '[data-testid="share-url"]'
      );

      // Should contain the campaign name in the URL
      expect(urlElement?.textContent).toContain("/campaigns/clean-water");
    });
  });
});

// Restore console.error after all tests
afterAll(() => {
  console.error = originalError;
});
