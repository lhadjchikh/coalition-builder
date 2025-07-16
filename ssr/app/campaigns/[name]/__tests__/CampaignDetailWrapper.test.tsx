import React from "react";
import { render } from "@testing-library/react";
import CampaignDetailWrapper from "../CampaignDetailWrapper";

// Mock the CampaignDetail component
jest.mock("@shared/components/CampaignDetail", () => {
  return function MockCampaignDetail({
    campaignId,
    initialCampaign,
  }: {
    campaignId?: number;
    initialCampaign?: any;
  }) {
    return (
      <div data-testid="mock-campaign-detail">
        Campaign Detail Component - ID: {campaignId} - Initial:{" "}
        {initialCampaign ? initialCampaign.title : "None"}
      </div>
    );
  };
});

// Mock the CSS imports
jest.mock("@frontend/components/Endorsements.css", () => ({}));
jest.mock("@frontend/App.css", () => ({}));

describe("CampaignDetailWrapper", () => {
  const mockCampaign = {
    id: 123,
    name: "test-campaign",
    title: "Test Campaign",
    summary: "A test campaign",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
  };

  it("should render CampaignDetail with correct campaign data", () => {
    const { getByTestId } = render(
      <CampaignDetailWrapper campaign={mockCampaign} />,
    );

    const campaignDetail = getByTestId("mock-campaign-detail");
    expect(campaignDetail).toBeInTheDocument();
    expect(campaignDetail).toHaveTextContent(
      "Campaign Detail Component - ID: 123 - Initial: Test Campaign",
    );
  });

  it("should pass through different campaigns correctly", () => {
    const testCampaigns = [
      { ...mockCampaign, id: 1, title: "Campaign 1" },
      { ...mockCampaign, id: 42, title: "Campaign 42" },
      { ...mockCampaign, id: 999, title: "Campaign 999" },
    ];

    testCampaigns.forEach((campaign) => {
      const { getByTestId, unmount } = render(
        <CampaignDetailWrapper campaign={campaign} />,
      );

      const campaignDetail = getByTestId("mock-campaign-detail");
      expect(campaignDetail).toHaveTextContent(
        `Campaign Detail Component - ID: ${campaign.id} - Initial: ${campaign.title}`,
      );

      // Clean up between test cases to avoid multiple elements
      unmount();
    });
  });

  it("should be marked as a client component", () => {
    // Read the actual file to verify it has "use client" directive
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "../CampaignDetailWrapper.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    expect(fileContent).toMatch(/^["']use client["'];?/);
  });
});
