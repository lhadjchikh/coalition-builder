import React from "react";
import { render, screen } from "@testing-library/react";
import CampaignPage from "../page";
import { apiClient } from "../../../../lib/api";
import { notFound } from "next/navigation";
import type { Campaign } from "../../../../types";

// Mock the apiClient module
jest.mock("../../../../lib/api", () => ({
  __esModule: true,
  apiClient: {
    getCampaignByName: jest.fn(),
    getCampaigns: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

// Mock structured data components
jest.mock("../../../../components/StructuredData", () => ({
  CampaignStructuredData: ({ title, description }: { title?: string; description?: string }) => (
    <script type="application/ld+json" data-testid="campaign-structured-data">
      {JSON.stringify({ title, description })}
    </script>
  ),
  BreadcrumbStructuredData: ({ items }: { items?: unknown[] }) => (
    <script type="application/ld+json" data-testid="breadcrumb-structured-data">
      {JSON.stringify(items)}
    </script>
  ),
}));

// Mock campaign page content
jest.mock("../CampaignPageContent", () => ({
  __esModule: true,
  default: ({ campaign }: { campaign?: Campaign }) => (
    <div data-testid="campaign-page-content">
      {campaign && (
        <>
          <div data-testid="campaign-title">{campaign.title}</div>
          <div data-testid="campaign-summary">{campaign.summary}</div>
          <div data-testid="campaign-name">{campaign.name}</div>
        </>
      )}
    </div>
  ),
}));

describe("CampaignPage", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display campaign successfully", async () => {
    (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(mockCampaign);

    const jsx = await CampaignPage({
      params: Promise.resolve({ name: "clean-water" }),
    });
    render(jsx);

    expect(screen.getByTestId("campaign-page-content")).toBeInTheDocument();
    expect(screen.getByTestId("campaign-title")).toHaveTextContent(
      "Clean Water Initiative",
    );
    expect(screen.getByTestId("campaign-summary")).toHaveTextContent(
      "Ensuring access to clean water for all communities",
    );
    expect(screen.getByTestId("campaign-name")).toHaveTextContent(
      "clean-water",
    );

    // Check structured data
    expect(screen.getByTestId("campaign-structured-data")).toBeInTheDocument();
    expect(
      screen.getByTestId("breadcrumb-structured-data"),
    ).toBeInTheDocument();

    expect(apiClient.getCampaignByName).toHaveBeenCalledWith("clean-water");
  });

  it("should handle campaign API error and call notFound", async () => {
    const error = new Error("Campaign not found");
    (apiClient.getCampaignByName as jest.Mock).mockRejectedValue(error);
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(
      CampaignPage({
        params: Promise.resolve({ name: "non-existent" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching campaign:", error);
    expect(notFound).toHaveBeenCalledTimes(1);
    expect(apiClient.getCampaignByName).toHaveBeenCalledWith("non-existent");

    consoleSpy.mockRestore();
  });

  it("should handle campaign with minimal data", async () => {
    const minimalCampaign = {
      id: 2,
      name: "minimal-campaign",
      title: "Minimal Campaign",
      summary: "A campaign with minimal data",
      active: true,
      created_at: "2023-01-01T00:00:00Z",
    };
    (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(
      minimalCampaign,
    );

    const jsx = await CampaignPage({
      params: Promise.resolve({ name: "minimal-campaign" }),
    });
    render(jsx);

    expect(screen.getByTestId("campaign-title")).toHaveTextContent(
      "Minimal Campaign",
    );
    expect(screen.getByTestId("campaign-summary")).toHaveTextContent(
      "A campaign with minimal data",
    );
    expect(screen.getByTestId("campaign-name")).toHaveTextContent(
      "minimal-campaign",
    );
  });

  it("should handle inactive campaign", async () => {
    const inactiveCampaign = {
      ...mockCampaign,
      active: false,
    };
    (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(
      inactiveCampaign,
    );

    const jsx = await CampaignPage({
      params: Promise.resolve({ name: "clean-water" }),
    });
    render(jsx);

    // Inactive campaigns should still be displayed
    expect(screen.getByTestId("campaign-title")).toHaveTextContent(
      "Clean Water Initiative",
    );
    expect(screen.getByTestId("campaign-name")).toHaveTextContent(
      "clean-water",
    );
  });

  it("should pass correct parameters to API client", async () => {
    (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(mockCampaign);

    await CampaignPage({
      params: Promise.resolve({ name: "test-campaign" }),
    });

    expect(apiClient.getCampaignByName).toHaveBeenCalledWith("test-campaign");
  });
});
