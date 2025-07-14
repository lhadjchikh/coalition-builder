/**
 * Tests for the SSR analytics service
 */

import analytics from "../analytics";

// Mock environment variable
const originalEnv = process.env;

// Mock window object
const mockWindow = {
  gtag: jest.fn(),
  dataLayer: [],
  CookieConsent: {
    acceptedCategory: jest.fn().mockReturnValue(true),
  },
  location: {
    href: "https://example.com/test",
  },
};

// Mock document
const mockDocument = {
  title: "Test Page",
  createElement: jest.fn().mockReturnValue({
    async: false,
    src: "",
  }),
  head: {
    appendChild: jest.fn(),
  },
  cookie: "analytics_consent=true",
};

// Mock console
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("SSR Analytics Service", () => {
  beforeEach(() => {
    // Reset environment
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_GA_TRACKING_ID: "G-TEST123456",
    };

    // Reset mocks
    jest.clearAllMocks();

    // Mock window
    Object.defineProperty(global, "window", {
      value: mockWindow,
      writable: true,
    });

    // Mock document
    Object.defineProperty(global, "document", {
      value: mockDocument,
      writable: true,
    });

    // Mock console
    global.console = mockConsole as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    // Reset window to undefined for SSR testing
    delete (global as any).window;
    delete (global as any).document;
  });

  describe("server-side behavior", () => {
    beforeEach(() => {
      // Remove window for server-side testing
      delete (global as any).window;
      delete (global as any).document;
    });

    it("should get tracking ID on server side", () => {
      expect(analytics.getTrackingId()).toBe("G-TEST123456");
    });

    it("should not initialize on server side", async () => {
      await analytics.initialize();

      // Should not throw errors or attempt to access window
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it("should not track events on server side", () => {
      analytics.trackPageView({
        page_title: "Test Page",
        page_location: "https://example.com/test",
        page_path: "/test",
      });

      analytics.trackEvent({
        action: "test_action",
        category: "test_category",
      });

      // Should not throw errors
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe("client-side behavior", () => {
    it("should initialize with tracking ID and consent", async () => {
      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Google Analytics initialized with ID:",
        "G-TEST123456",
      );
    });

    it("should not initialize without consent", async () => {
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(false);

      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Analytics cookies not enabled, skipping GA initialization",
      );
    });

    it("should track page views with path", () => {
      analytics.trackPageView({
        page_title: "Test Page",
        page_location: "https://example.com/test",
        page_path: "/test",
      });

      expect(mockWindow.gtag).toHaveBeenCalledWith("event", "page_view", {
        page_title: "Test Page",
        page_location: "https://example.com/test",
        page_path: "/test",
      });
    });

    it("should track navigation events", () => {
      analytics.trackNavigation("/new-page", "New Page");

      expect(mockWindow.gtag).toHaveBeenCalledWith("event", "page_view", {
        page_title: "New Page",
        page_location: "https://example.com/test",
        page_path: "/new-page",
      });
    });

    it("should track legal document views", () => {
      analytics.trackLegalDocumentView("terms");

      expect(mockWindow.gtag).toHaveBeenCalledWith(
        "event",
        "view_legal_document",
        {
          event_category: "legal",
          event_label: "terms",
          value: undefined,
        },
      );
    });

    it("should track campaign views", () => {
      analytics.trackCampaignView("Test Campaign");

      expect(mockWindow.gtag).toHaveBeenCalledWith("event", "view_campaign", {
        event_category: "engagement",
        event_label: "Test Campaign",
        value: undefined,
      });
    });
  });

  describe("consent checking", () => {
    it("should check CookieConsent when available", async () => {
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(true);

      await analytics.initialize();

      expect(mockWindow.CookieConsent.acceptedCategory).toHaveBeenCalledWith(
        "analytics",
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        "Google Analytics initialized with ID:",
        "G-TEST123456",
      );
    });

    it("should fall back to cookie check when CookieConsent not available", async () => {
      delete mockWindow.CookieConsent;
      mockDocument.cookie = "analytics_consent=true";

      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        "Google Analytics initialized with ID:",
        "G-TEST123456",
      );
    });

    it("should handle CookieConsent errors gracefully", async () => {
      mockWindow.CookieConsent.acceptedCategory.mockImplementation(() => {
        throw new Error("CookieConsent error");
      });

      await analytics.initialize();

      expect(mockConsole.warn).toHaveBeenCalledWith(
        "Could not check analytics cookie consent:",
        expect.any(Error),
      );
    });
  });

  describe("configuration", () => {
    it("should return null tracking ID when not configured", () => {
      process.env.NEXT_PUBLIC_GA_TRACKING_ID = "";

      // Create new instance to pick up env change
      const { analytics: newAnalytics } = require("../analytics");

      expect(newAnalytics.getTrackingId()).toBeNull();
    });

    it("should not initialize without tracking ID", async () => {
      process.env.NEXT_PUBLIC_GA_TRACKING_ID = "";

      await analytics.initialize();

      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Google Analytics initialized"),
      );
    });
  });
});

// Test type exports
describe("Analytics Types", () => {
  it("should export expected interfaces", () => {
    const event: import("../analytics").AnalyticsEvent = {
      action: "test",
      category: "test",
      label: "test",
      value: 1,
    };

    const pageView: import("../analytics").PageViewEvent = {
      page_title: "Test",
      page_location: "https://example.com",
      page_path: "/test",
    };

    expect(event).toBeDefined();
    expect(pageView).toBeDefined();
  });
});
