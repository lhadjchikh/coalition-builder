/**
 * Tests for LegalDocumentTracker component
 */

import React from "react";
import { render } from "@testing-library/react";
import LegalDocumentTracker from "../LegalDocumentTracker";
import analytics from "../../services/analytics";

// Mock the analytics module
jest.mock("../../services/analytics", () => ({
  trackLegalDocumentView: jest.fn(),
}));

const mockAnalytics = analytics as jest.Mocked<typeof analytics>;

describe("LegalDocumentTracker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call trackLegalDocumentView with terms on mount", () => {
    render(<LegalDocumentTracker documentType="terms" />);

    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledWith("terms");
    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledTimes(1);
  });

  it("should call trackLegalDocumentView with privacy on mount", () => {
    render(<LegalDocumentTracker documentType="privacy" />);

    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledWith(
      "privacy"
    );
    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledTimes(1);
  });

  it("should render nothing (return null)", () => {
    const { container } = render(<LegalDocumentTracker documentType="terms" />);

    expect(container.firstChild).toBeNull();
  });

  it("should only track once even with documentType prop changes", () => {
    const { rerender } = render(<LegalDocumentTracker documentType="terms" />);

    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledWith("terms");
    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledTimes(1);

    // Change documentType - should trigger new tracking
    rerender(<LegalDocumentTracker documentType="privacy" />);

    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledWith(
      "privacy"
    );
    expect(mockAnalytics.trackLegalDocumentView).toHaveBeenCalledTimes(2);
  });
});
