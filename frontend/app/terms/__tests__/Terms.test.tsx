import React from "react";
import { render, screen } from "@testing-library/react";
import Terms from "../page";
import { apiClient } from "../../../lib/api";

// Mock the apiClient
jest.mock("../../../lib/api", () => ({
  __esModule: true,
  apiClient: {
    getTermsOfUse: jest.fn(),
  },
}));

// Mock analytics service
jest.mock("../../../services/analytics", () => ({
  __esModule: true,
  default: {
    trackLegalDocumentView: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("Terms", () => {
  const mockTermsData = {
    document_type: "terms_of_use",
    content: "<h1>Terms of Use</h1><p>These are our terms of use.</p>",
    effective_date: "2023-01-01",
    version: "1.0",
  };

  const { notFound } = require("next/navigation");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders terms of use successfully", async () => {
    (apiClient.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);

    const jsx = await Terms({});
    render(jsx);

    // Check that content is rendered using innerHTML since it's dangerouslySetInnerHTML
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(screen.getByText("These are our terms of use.")).toBeInTheDocument();
  });

  it("handles apiClient errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    (apiClient.getTermsOfUse as jest.Mock).mockRejectedValue(
      new Error("Failed to load terms"),
    );

    const jsx = await Terms({});
    render(jsx);

    // Check error message
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(
      screen.getByText("Error loading terms: Failed to load terms"),
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("calls notFound when no data is returned", async () => {
    (apiClient.getTermsOfUse as jest.Mock).mockResolvedValue(null);
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(Terms({})).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("makes correct apiClient calls", async () => {
    (apiClient.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);

    await Terms({});

    expect(apiClient.getTermsOfUse).toHaveBeenCalledTimes(1);
  });

  it("uses dangerouslySetInnerHTML for content rendering", async () => {
    (apiClient.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);

    const jsx = await Terms({});
    render(jsx);

    // Check that the HTML content is properly rendered
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(screen.getByText("These are our terms of use.")).toBeInTheDocument();
  });
});
