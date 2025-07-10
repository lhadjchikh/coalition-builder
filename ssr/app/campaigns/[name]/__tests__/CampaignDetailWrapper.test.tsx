import React from "react";
import { render } from "@testing-library/react";
import CampaignDetailWrapper from "../CampaignDetailWrapper";

// Mock the CampaignDetail component
jest.mock("@frontend/components/CampaignDetail", () => {
  return function MockCampaignDetail({ campaignId }: { campaignId?: number }) {
    return (
      <div data-testid="mock-campaign-detail">
        Campaign Detail Component - ID: {campaignId}
      </div>
    );
  };
});

// Mock the CSS imports
jest.mock("@frontend/components/Endorsements.css", () => ({}));
jest.mock("@frontend/App.css", () => ({}));

describe("CampaignDetailWrapper", () => {
  it("should render CampaignDetail with correct campaignId", () => {
    const { getByTestId } = render(<CampaignDetailWrapper campaignId={123} />);

    const campaignDetail = getByTestId("mock-campaign-detail");
    expect(campaignDetail).toBeInTheDocument();
    expect(campaignDetail).toHaveTextContent(
      "Campaign Detail Component - ID: 123",
    );
  });

  it("should pass through different campaign IDs correctly", () => {
    const testCases = [1, 42, 999, 0];

    testCases.forEach((id) => {
      const { getByTestId, unmount } = render(
        <CampaignDetailWrapper campaignId={id} />,
      );

      const campaignDetail = getByTestId("mock-campaign-detail");
      expect(campaignDetail).toHaveTextContent(
        `Campaign Detail Component - ID: ${id}`,
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
