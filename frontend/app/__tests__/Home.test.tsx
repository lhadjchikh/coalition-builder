import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "../page";
import { getFallbackHomepage } from "../../utils/homepage-data";
import type { HomePage, Campaign, ContentBlock } from "../../types";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the API utility
jest.mock("../../lib/utils/api", () => ({
  fetchApiResource: jest.fn(),
}));

import { fetchApiResource } from "../../lib/utils/api";
const mockFetchApiResource = fetchApiResource as jest.MockedFunction<
  typeof fetchApiResource
>;

// Mock theme utilities
jest.mock("../../utils/theme", () => ({
  generateCSSVariables: jest.fn(() => ":root { --primary: #000; }"),
}));

// Mock homepage utilities
jest.mock("../../utils/homepage-data", () => ({
  getFallbackHomepage: jest.fn(() => ({
    id: 0,
    organization_name: "Coalition Builder",
    tagline: "Fallback Tagline",
    theme: {},
  })),
}));

// Mock the components
jest.mock("../../components/HomePage", () => ({
  __esModule: true,
  default: ({
    homepage,
    campaigns,
    homepageError,
    campaignsError,
    contentBlocks,
  }: {
    homepage?: HomePage;
    campaigns?: Campaign[];
    homepageError?: string | null;
    campaignsError?: string | null;
    contentBlocks?: ContentBlock[];
  }) => (
    <div data-testid="home-page">
      {homepage && (
        <div data-testid="homepage-name">{homepage.organization_name}</div>
      )}
      {homepageError && <div data-testid="homepage-error">{homepageError}</div>}
      {campaigns && (
        <div data-testid="campaigns-count">{campaigns.length} campaigns</div>
      )}
      {campaignsError && (
        <div data-testid="campaigns-error">{campaignsError}</div>
      )}
      {contentBlocks && (
        <div data-testid="content-blocks-count">
          {contentBlocks.length} blocks
        </div>
      )}
    </div>
  ),
}));

jest.mock("../../components/HeroSection", () => ({
  __esModule: true,
  default: () => <div>HeroSection</div>,
}));

jest.mock("../../components/ContentBlock", () => ({
  __esModule: true,
  default: () => <div>ContentBlock</div>,
}));

jest.mock("../../components/SocialLinks", () => ({
  __esModule: true,
  default: () => <div>SocialLinks</div>,
}));

describe("Home Page", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Test Tagline",
    hero_title: "Welcome",
    hero_subtitle: "Subtitle",
    hero_background_image_url: "",
    cta_title: "Get Involved",
    cta_content: "Join us",
    cta_button_text: "Learn More",
    cta_button_url: "/about",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Our Campaigns",
    campaigns_section_subtitle: "Active campaigns",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    theme: {},
  };

  const mockCampaigns = [
    {
      id: 1,
      name: "campaign-1",
      title: "Campaign 1",
      summary: "Summary 1",
      active: true,
    },
    {
      id: 2,
      name: "campaign-2",
      title: "Campaign 2",
      summary: "Summary 2",
      active: true,
    },
  ];

  const mockContentBlocks = [
    {
      id: 1,
      block_type: "text",
      content: "Block 1",
      page_type: "homepage",
      order: 1,
    },
    {
      id: 2,
      block_type: "text",
      content: "Block 2",
      page_type: "homepage",
      order: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display data successfully", async () => {
    mockFetchApiResource
      .mockResolvedValueOnce(mockHomepage) // homepage
      .mockResolvedValueOnce(mockCampaigns) // campaigns
      .mockResolvedValueOnce(mockContentBlocks); // content blocks

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Test Organization"
    );
    expect(screen.getByTestId("campaigns-count")).toHaveTextContent(
      "2 campaigns"
    );
    expect(screen.getByTestId("content-blocks-count")).toHaveTextContent(
      "2 blocks"
    );

    expect(mockFetchApiResource).toHaveBeenCalledTimes(3);
  });

  it("should handle homepage fetch error and use fallback", async () => {
    const error = new Error("Failed to fetch homepage");
    mockFetchApiResource
      .mockRejectedValueOnce(error) // homepage error
      .mockResolvedValueOnce(mockCampaigns) // campaigns success
      .mockResolvedValueOnce(mockContentBlocks); // content blocks success

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Home();
    render(jsx);

    // Should use fallback homepage
    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Coalition Builder"
    );
    expect(screen.getByTestId("homepage-error")).toHaveTextContent(
      "Failed to fetch homepage"
    );
    expect(screen.getByTestId("campaigns-count")).toHaveTextContent(
      "2 campaigns"
    );

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching homepage:", error);
    expect(getFallbackHomepage).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("should handle campaigns fetch error", async () => {
    const error = new Error("Failed to fetch campaigns");
    mockFetchApiResource
      .mockResolvedValueOnce(mockHomepage) // homepage success
      .mockRejectedValueOnce(error) // campaigns error
      .mockResolvedValueOnce(mockContentBlocks); // content blocks success

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Test Organization"
    );
    expect(screen.getByTestId("campaigns-error")).toHaveTextContent(
      "Failed to fetch campaigns"
    );
    expect(screen.getByTestId("content-blocks-count")).toHaveTextContent(
      "2 blocks"
    );

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching campaigns:", error);
    consoleSpy.mockRestore();
  });

  it("should handle content blocks fetch error", async () => {
    const error = new Error("Failed to fetch content blocks");
    mockFetchApiResource
      .mockResolvedValueOnce(mockHomepage) // homepage success
      .mockResolvedValueOnce(mockCampaigns) // campaigns success
      .mockRejectedValueOnce(error); // content blocks error

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Test Organization"
    );
    expect(screen.getByTestId("campaigns-count")).toHaveTextContent(
      "2 campaigns"
    );
    expect(screen.getByTestId("content-blocks-count")).toHaveTextContent(
      "0 blocks"
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching homepage content blocks:",
      error
    );
    consoleSpy.mockRestore();
  });

  it("should handle non-Error object rejection", async () => {
    mockFetchApiResource
      .mockRejectedValueOnce("String error") // homepage error
      .mockResolvedValueOnce(mockCampaigns) // campaigns success
      .mockResolvedValueOnce(mockContentBlocks); // content blocks success

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Coalition Builder"
    );
    expect(screen.getByTestId("homepage-error")).toHaveTextContent(
      "Failed to fetch homepage"
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching homepage:",
      "String error"
    );
    consoleSpy.mockRestore();
  });

  it("should handle all API errors gracefully", async () => {
    const homepageError = new Error("Homepage failed");
    const campaignsError = new Error("Campaigns failed");
    const contentBlocksError = new Error("Content blocks failed");

    mockFetchApiResource
      .mockRejectedValueOnce(homepageError)
      .mockRejectedValueOnce(campaignsError)
      .mockRejectedValueOnce(contentBlocksError);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Home();
    render(jsx);

    // Should use fallback homepage and show errors
    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Coalition Builder"
    );
    expect(screen.getByTestId("homepage-error")).toHaveTextContent(
      "Homepage failed"
    );
    expect(screen.getByTestId("campaigns-error")).toHaveTextContent(
      "Campaigns failed"
    );
    expect(screen.getByTestId("content-blocks-count")).toHaveTextContent(
      "0 blocks"
    );

    expect(consoleSpy).toHaveBeenCalledTimes(3);
    consoleSpy.mockRestore();
  });

  it("should handle empty arrays gracefully", async () => {
    mockFetchApiResource
      .mockResolvedValueOnce(mockHomepage) // homepage
      .mockResolvedValueOnce([]) // empty campaigns
      .mockResolvedValueOnce([]); // empty content blocks

    const jsx = await Home();
    render(jsx);

    expect(screen.getByTestId("homepage-name")).toHaveTextContent(
      "Test Organization"
    );
    expect(screen.getByTestId("campaigns-count")).toHaveTextContent(
      "0 campaigns"
    );
    expect(screen.getByTestId("content-blocks-count")).toHaveTextContent(
      "0 blocks"
    );
  });
});
