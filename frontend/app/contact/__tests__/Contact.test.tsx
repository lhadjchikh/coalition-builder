import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "../page";
import { ssrApiClient } from "../../../lib/api";
import { getFallbackHomepage } from "../../../utils/homepage-data";
import type { HomePage, ContentBlock } from "../../../types";

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
jest.mock("../../../components/ContactPage", () => ({
  __esModule: true,
  default: ({ orgInfo, contentBlocks, error }: {
    orgInfo?: HomePage;
    contentBlocks?: ContentBlock[];
    error?: string;
  }) => (
    <div data-testid="contact-page">
      {orgInfo && <div data-testid="org-info">{orgInfo.organization_name}</div>}
      {error && <div data-testid="error">{error}</div>}
      {contentBlocks && (
        <div data-testid="content-blocks">{contentBlocks.length} blocks</div>
      )}
      <div data-testid="contact-form">Contact Form</div>
    </div>
  ),
}));

// Mock ContentBlock component
jest.mock("../../../components/ContentBlock", () => ({
  __esModule: true,
  default: () => <div>ContentBlock</div>,
}));

describe("Contact Page", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Community Coalition",
    tagline: "Together we are stronger",
    hero_title: "Contact Us",
    hero_subtitle: "Get in touch",
    hero_background_image_url: "",
    cta_title: "Reach Out",
    cta_content: "We would love to hear from you",
    cta_button_text: "Send Message",
    cta_button_url: "",
    facebook_url: "https://facebook.com/coalition",
    twitter_url: "https://twitter.com/coalition",
    instagram_url: "",
    linkedin_url: "https://linkedin.com/company/coalition",
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
      content: "Contact Information",
      page_type: "contact",
      order: 1,
    },
    {
      id: 2,
      block_type: "text",
      content: "Office Hours",
      page_type: "contact",
      order: 2,
    },
    {
      id: 3,
      block_type: "map",
      content: "Location Map",
      page_type: "contact",
      order: 3,
    },
    {
      id: 4,
      block_type: "form",
      content: "Contact Form",
      page_type: "contact",
      order: 4,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display all data successfully", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      mockContentBlocks,
    );

    const jsx = await Contact();
    render(jsx);

    expect(screen.getByTestId("org-info")).toHaveTextContent(
      "Community Coalition",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("4 blocks");
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();

    expect(ssrApiClient.getHomepage).toHaveBeenCalledTimes(1);
    expect(ssrApiClient.getContentBlocksByPageType).toHaveBeenCalledWith(
      "contact",
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

    const jsx = await Contact();
    render(jsx);

    // Should use fallback homepage
    expect(screen.getByTestId("org-info")).toHaveTextContent(
      "Fallback Organization",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("4 blocks");
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching homepage:",
      "Network error",
    );
    expect(getFallbackHomepage).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("should handle content blocks API error gracefully", async () => {
    const error = new Error("Failed to fetch data");
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockRejectedValue(
      error,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Contact();
    render(jsx);

    expect(screen.getByTestId("org-info")).toHaveTextContent(
      "Community Coalition",
    );
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Failed to fetch data",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching contact content blocks:",
      "Failed to fetch data",
    );
    consoleSpy.mockRestore();
  });

  it("should handle empty content blocks", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockResolvedValue(
      [],
    );

    const jsx = await Contact();
    render(jsx);

    expect(screen.getByTestId("org-info")).toHaveTextContent(
      "Community Coalition",
    );
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("should handle both API errors", async () => {
    const error = new Error("Network error");
    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(error);
    (ssrApiClient.getContentBlocksByPageType as jest.Mock).mockRejectedValue(
      error,
    );

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const jsx = await Contact();
    render(jsx);

    // Should use fallback homepage and show error for content blocks
    expect(screen.getByTestId("org-info")).toHaveTextContent(
      "Fallback Organization",
    );
    expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    expect(screen.getByTestId("content-blocks")).toHaveTextContent("0 blocks");
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching homepage:",
      "Network error",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching contact content blocks:",
      "Network error",
    );
    consoleSpy.mockRestore();
  });
});
