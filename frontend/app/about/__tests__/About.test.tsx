import React from "react";
import { render, screen } from "@testing-library/react";
import About from "../page";
import { ssrApiClient } from "../../../lib/api";
import { getFallbackHomepage } from "../../../utils/homepage-data";

// Mock the ssrApiClient module
jest.mock("../../../lib/api", () => ({
  __esModule: true,
  ssrApiClient: {
    getHomepage: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
  },
}));

// Mock theme utilities
jest.mock("../../../utils/theme", () => ({
  generateCSSVariables: jest.fn(() => ":root { --primary: #000; }"),
}));

// Mock homepage utilities
jest.mock("../../../utils/homepage-data", () => ({
  getFallbackHomepage: jest.fn(() => ({
    id: 0,
    organization_name: "Fallback Organization",
    tagline: "Fallback Tagline",
    theme: {},
  })),
}));

// Mock the components
jest.mock("../../../components/AboutPage", () => ({
  __esModule: true,
  default: ({ orgInfo, contentBlocks, error }: any) => (
    <div data-testid="about-page">
      {orgInfo && <div data-testid="org-name">{orgInfo.organization_name}</div>}
      {error && <div data-testid="error">{error}</div>}
      {contentBlocks && (
        <div data-testid="content-blocks">{contentBlocks.length} blocks</div>
      )}
    </div>
  ),
}));

// Mock ContentBlock component
jest.mock("../../../components/ContentBlock", () => ({
  __esModule: true,
  default: () => <div>ContentBlock</div>,
}));

describe("About Page", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Building strong coalitions",
    hero_title: "About Us",
    hero_subtitle: "Our Story",
    hero_background_image_url: "",
    cta_title: "Join Us",
    cta_content: "Be part of our mission",
    cta_button_text: "Get Involved",
    cta_button_url: "/contact",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Our Work",
    campaigns_section_subtitle: "",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    theme: {},
  };

  const mockContentBlocks = [
    {
      id: 1,
      block_type: "text",
      content: "Our Mission",
      page_type: "about",
      order: 1,
    },
    {
      id: 2,
      block_type: "text",
      content: "Our Vision",
      page_type: "about",
      order: 2,
    },
    {
      id: 3,
      block_type: "text",
      content: "Our Values",
      page_type: "about",
      order: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display data successfully", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    const jsx = await About();
    render(jsx);

    expect(screen.getByTestId("org-name")).toHaveTextContent(
      "Test Organization",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("3 blocks");

    expect(ssrApiClient.getHomepage).toHaveBeenCalledTimes(1);
    expect(ssrApiClient.getContentBlocksByPageType).toHaveBeenCalledWith(
      "about",
    );
  });

  it("should handle homepage API error gracefully", async () => {
    const error = new Error("Network error");
    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await About();
    render(jsx);

    // Should use fallback homepage
    expect(screen.getByTestId("org-name")).toHaveTextContent(
      "Fallback Organization",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("3 blocks");

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching homepage:", error);
    expect(getFallbackHomepage).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("should handle content blocks API error gracefully", async () => {
    const error = new Error("Failed to fetch content");
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockRejectedValue(
      error,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await About();
    render(jsx);

    expect(screen.getByTestId("org-name")).toHaveTextContent(
      "Test Organization",
    );
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Failed to fetch content",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching about content blocks:",
      error,
    );
    consoleSpy.mockRestore();
  });

  it("should display with empty content blocks", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      [],
    );

    const jsx = await About();
    render(jsx);

    expect(screen.getByTestId("org-name")).toHaveTextContent(
      "Test Organization",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");
  });

  it("should handle both API errors", async () => {
    const error = new Error("Network error");
    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockRejectedValue(
      error,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await About();
    render(jsx);

    // Should use fallback homepage and show error for content blocks
    expect(screen.getByTestId("org-name")).toHaveTextContent(
      "Fallback Organization",
    );
    expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching homepage:", error);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching about content blocks:",
      error,
    );
    consoleSpy.mockRestore();
  });
});
