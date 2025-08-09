/**
 * Tests for GoogleAnalytics component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import GoogleAnalytics from "../GoogleAnalytics";
import analytics from "../../services/analytics";

// Mock Next.js hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Script component
jest.mock("next/script", () => {
  return function MockScript({ src, id, children, ...props }: { src?: string; id?: string; children?: React.ReactNode; [key: string]: unknown }) {
    return (
      <div
        data-src={src}
        id={id}
        data-testid={id || "google-analytics-script"}
        {...props}
      >
        {children}
      </div>
    );
  };
});

// Mock the analytics module
jest.mock("../../services/analytics", () => ({
  getTrackingId: jest.fn(),
  initialize: jest.fn(),
  trackNavigation: jest.fn(),
  onConsentChange: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockAnalytics = analytics as jest.Mocked<typeof analytics>;

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window object
    Object.defineProperty(window, "addEventListener", {
      value: mockAddEventListener,
      writable: true,
    });
    Object.defineProperty(window, "removeEventListener", {
      value: mockRemoveEventListener,
      writable: true,
    });

    // Default mocks
    mockUsePathname.mockReturnValue("/test");
    mockAnalytics.getTrackingId.mockReturnValue("G-TEST123456");
  });

  it("should render Script tags when tracking ID is available", () => {
    render(<GoogleAnalytics />);

    // Check that the Google Analytics script is rendered
    const gaScript = screen.getByTestId("google-analytics-script");
    expect(gaScript).toBeInTheDocument();
    expect(gaScript).toHaveAttribute(
      "src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123456",
    );

    // Check that the initialization script is rendered
    const initScript = screen.getByTestId("google-analytics");
    expect(initScript).toBeInTheDocument();
    expect(initScript.textContent).toContain(
      "window.dataLayer = window.dataLayer || []",
    );
    expect(initScript.textContent).toContain(
      "function gtag(){dataLayer.push(arguments);}",
    );
  });

  it("should return null when no tracking ID is available", () => {
    mockAnalytics.getTrackingId.mockReturnValue(null);

    const { container } = render(<GoogleAnalytics />);

    expect(container.firstChild).toBeNull();
  });

  it("should initialize analytics on mount", () => {
    render(<GoogleAnalytics />);

    expect(mockAnalytics.initialize).toHaveBeenCalledTimes(1);
  });

  it("should track navigation when pathname changes", () => {
    const { rerender } = render(<GoogleAnalytics />);

    expect(mockAnalytics.trackNavigation).toHaveBeenCalledWith("/test");

    // Change pathname
    mockUsePathname.mockReturnValue("/new-path");
    rerender(<GoogleAnalytics />);

    expect(mockAnalytics.trackNavigation).toHaveBeenCalledWith("/new-path");
    expect(mockAnalytics.trackNavigation).toHaveBeenCalledTimes(2);
  });

  it("should not track navigation when pathname is null", () => {
    mockUsePathname.mockReturnValue(null);

    render(<GoogleAnalytics />);

    expect(mockAnalytics.trackNavigation).not.toHaveBeenCalled();
  });

  it("should register consent change event listener", () => {
    render(<GoogleAnalytics />);

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "cc:onConsentChange",
      expect.any(Function),
    );
  });

  it("should call onConsentChange when consent changes", () => {
    render(<GoogleAnalytics />);

    // Get the registered event handler
    const [[eventName, handler]] = mockAddEventListener.mock.calls;
    expect(eventName).toBe("cc:onConsentChange");

    // Simulate consent change event
    handler();

    expect(mockAnalytics.onConsentChange).toHaveBeenCalledTimes(1);
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = render(<GoogleAnalytics />);

    // Get the registered event handler
    const [[, handler]] = mockAddEventListener.mock.calls;

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "cc:onConsentChange",
      handler,
    );
  });
});
