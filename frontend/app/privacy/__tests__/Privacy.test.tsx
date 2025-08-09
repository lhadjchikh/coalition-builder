import React from "react";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "../page";
import { apiClient } from "../../../lib/api";

// Mock the apiClient
jest.mock("../../../lib/api", () => ({
  __esModule: true,
  apiClient: {
    getPrivacyPolicy: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

// Mock LegalDocumentTracker component
jest.mock("../../../components/LegalDocumentTracker", () => ({
  __esModule: true,
  default: ({ documentType }: { documentType: string }) => (
    <div data-testid="legal-tracker">{documentType}</div>
  ),
}));

describe("PrivacyPage", () => {
  const mockPrivacyData = {
    document_type: "privacy_policy",
    content: "<h1>Privacy Policy</h1><p>This is our privacy policy.</p>",
    effective_date: "2023-01-01",
    version: "1.0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders privacy policy successfully", async () => {
    (apiClient.getPrivacyPolicy as jest.Mock).mockResolvedValue(
      mockPrivacyData,
    );

    const result = await PrivacyPage({});
    const { container } = render(result);

    // Check content is rendered
    expect(screen.getByTestId("legal-tracker")).toHaveTextContent("privacy");
    expect(container.innerHTML).toContain("<h1>Privacy Policy</h1>");
    expect(container.innerHTML).toContain("<p>This is our privacy policy.</p>");
  });

  it("handles apiClient errors gracefully", async () => {
    (apiClient.getPrivacyPolicy as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    const result = await PrivacyPage({});
    const { container } = render(result);

    expect(container.innerHTML).toContain("Privacy Policy");
    expect(container.innerHTML).toContain(
      "Error loading privacy policy: Network error",
    );
    expect(container.querySelector(".bg-red-50")).toBeTruthy();
  });

  it("calls notFound when privacy data is null", async () => {
    (apiClient.getPrivacyPolicy as jest.Mock).mockResolvedValue(null);

    const { notFound } = require("next/navigation");
    // Mock notFound to throw an error to simulate Next.js behavior
    notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(PrivacyPage({})).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("makes correct apiClient calls", async () => {
    (apiClient.getPrivacyPolicy as jest.Mock).mockResolvedValue(
      mockPrivacyData,
    );

    await PrivacyPage({});

    expect(apiClient.getPrivacyPolicy).toHaveBeenCalledTimes(1);
  });

  it("uses dangerouslySetInnerHTML for content rendering", async () => {
    (apiClient.getPrivacyPolicy as jest.Mock).mockResolvedValue(
      mockPrivacyData,
    );

    const result = await PrivacyPage({});
    const { container } = render(result);

    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeTruthy();
    expect(proseDiv?.innerHTML).toContain(mockPrivacyData.content);
  });
});
