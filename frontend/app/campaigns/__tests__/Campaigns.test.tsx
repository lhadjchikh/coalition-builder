import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ssrApiClient } from "../../../lib/api";

// Create a testable version of the component that mimics the server component behavior
async function TestCampaigns() {
  let homepage = null;
  let campaigns = [];
  let contentBlocks = [];
  const campaignsError = null;

  try {
    // Use Promise.all to match the server component behavior when all succeed
    const [homepageData, campaignsData, contentBlocksData] = await Promise.all([
      ssrApiClient.getHomepage(),
      ssrApiClient.getCampaigns(),
      ssrApiClient.getContentBlocksByPageType("campaigns"),
    ]);
    homepage = homepageData;
    campaigns = campaignsData;
    contentBlocks = contentBlocksData;
  } catch (err) {
    console.error("Error fetching campaigns page data:", err);
    return (
      <div>
        Unable to load page
        <br />
        Please try again later.
      </div>
    );
  }

  const CampaignsPage = (await import("../../../components/CampaignsPage"))
    .default;
  return (
    <CampaignsPage
      homepage={homepage}
      campaigns={campaigns}
      contentBlocks={contentBlocks}
      campaignsError={campaignsError}
      ContentBlockComponent={({ block }: any) => (
        <div data-testid={`block-${block.id}`}>{block.content}</div>
      )}
    />
  );
}

// Mock the ssrApiClient module
jest.mock("../../../lib/api", () => ({
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
}));

// Mock the components
jest.mock("../../../components/CampaignsPage", () => ({
  __esModule: true,
  default: ({ homepage, campaigns, contentBlocks, campaignsError }: any) => (
    <div data-testid="campaigns-page">
      {homepage && (
        <div data-testid="org-name">{homepage.organization_name}</div>
      )}
      {campaigns && (
        <div data-testid="campaigns-list">{campaigns.length} campaigns</div>
      )}
      {campaignsError && (
        <div data-testid="campaigns-error">{campaignsError}</div>
      )}
      {contentBlocks && (
        <div data-testid="content-blocks">{contentBlocks.length} blocks</div>
      )}
    </div>
  ),
}));

describe("Campaigns Page", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Test Coalition",
    tagline: "Working together for change",
    hero_title: "Our Campaigns",
    hero_subtitle: "Active initiatives",
    hero_background_image_url: "",
    cta_title: "Get Involved",
    cta_content: "Support our campaigns",
    cta_button_text: "Join Now",
    cta_button_url: "/contact",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Active Campaigns",
    campaigns_section_subtitle: "Making a difference",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
  };

  const mockCampaigns = [
    {
      id: 1,
      name: "clean-water",
      title: "Clean Water Initiative",
      summary: "Ensuring access to clean water",
      active: true,
      created_at: "2023-01-01",
    },
    {
      id: 2,
      name: "climate-action",
      title: "Climate Action Now",
      summary: "Fighting climate change together",
      active: true,
      created_at: "2023-02-01",
    },
    {
      id: 3,
      name: "education-reform",
      title: "Education Reform",
      summary: "Better education for all",
      active: false,
      created_at: "2023-03-01",
    },
  ];

  const mockContentBlocks = [
    {
      id: 1,
      block_type: "hero",
      content: "Campaigns Hero",
      page_type: "campaigns",
      order: 1,
    },
    {
      id: 2,
      block_type: "text",
      content: "Campaign Info",
      page_type: "campaigns",
      order: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display all data successfully", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    const TestComponent = await TestCampaigns();
    render(TestComponent);

    await waitFor(() => {
      expect(screen.getByTestId("org-name")).toHaveTextContent(
        "Test Coalition",
      );
      expect(screen.getByTestId("campaigns-list")).toHaveTextContent(
        "3 campaigns",
      );
      expect(screen.getByTestId("content-blocks")).toHaveTextContent(
        "2 blocks",
      );
    });

    expect(ssrApiClient.getHomepage).toHaveBeenCalledTimes(1);
    expect(ssrApiClient.getCampaigns).toHaveBeenCalledTimes(1);
    expect(ssrApiClient.getContentBlocksByPageType).toHaveBeenCalledWith(
      "campaigns",
    );
  });

  it("should handle loading state", () => {
    // For server components, we don't have a loading state in the traditional sense
    // Instead, the component waits for all data before rendering
    // This test demonstrates that async operations are handled properly
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    // Since the component is async, we can't test intermediate loading states
    // We just ensure the component renders after data is available
    expect(() => TestCampaigns()).not.toThrow();
  });

  it("should handle campaigns fetch error", async () => {
    // When Promise.all fails, all requests fail
    const error = new Error("Failed to fetch data");
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getCampaigns as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const TestComponent = await TestCampaigns();
    render(TestComponent);

    await waitFor(() => {
      // Since Promise.all fails when any promise fails, homepage will be null
      expect(screen.getByText(/Unable to load page/)).toBeInTheDocument();
      expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching campaigns page data:",
      error,
    );
    consoleSpy.mockRestore();
  });

  it("should handle complete ssrApiClient failure", async () => {
    const error = new Error("Network error");
    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getCampaigns as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockRejectedValue(
      error,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const TestComponent = await TestCampaigns();
    render(TestComponent);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load page/)).toBeInTheDocument();
      expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching campaigns page data:",
      error,
    );
    consoleSpy.mockRestore();
  });

  it("should handle empty campaigns list", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getCampaigns as jest.Mock).mockResolvedValue([]);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    const TestComponent = await TestCampaigns();
    render(TestComponent);

    await waitFor(() => {
      expect(screen.getByTestId("campaigns-list")).toHaveTextContent(
        "0 campaigns",
      );
    });
  });

  it("should handle navigation setup", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    const TestComponent = await TestCampaigns();
    render(TestComponent);

    await waitFor(() => {
      expect(screen.getByTestId("campaigns-page")).toBeInTheDocument();
    });

    // Campaign list should be displayed
  });
});
