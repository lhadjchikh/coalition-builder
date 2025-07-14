/**
 * SSR-specific tests for the unified analytics service
 *
 * Core analytics functionality is tested in frontend tests.
 * These tests focus on SSR-specific behavior and integration.
 */

// Mock environment variable before importing
process.env.NEXT_PUBLIC_GA_TRACKING_ID = "G-TEST123456";

import analytics from "@shared/services/analytics";

const originalEnv = process.env;

describe("Analytics Service - SSR Integration", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Server-side Environment", () => {
    beforeEach(() => {
      // Ensure we're in a server-like environment
      delete (global as any).window;
      delete (global as any).document;
    });

    it("should be importable in SSR environment", () => {
      expect(analytics).toBeDefined();
      expect(typeof analytics.getTrackingId).toBe("function");
      expect(typeof analytics.initialize).toBe("function");
      expect(typeof analytics.trackPageView).toBe("function");
      expect(typeof analytics.trackEvent).toBe("function");
      expect(typeof analytics.trackNavigation).toBe("function");
    });

    it("should get tracking ID from NEXT_PUBLIC_GA_TRACKING_ID", () => {
      // Reset service to pick up environment
      (analytics as any)._resetForTesting();
      expect(analytics.getTrackingId()).toBe("G-TEST123456");
    });

    it("should handle missing tracking ID gracefully", () => {
      process.env.NEXT_PUBLIC_GA_TRACKING_ID = "";
      process.env.REACT_APP_GA_TRACKING_ID = "";

      (analytics as any)._resetForTesting();
      expect(analytics.getTrackingId()).toBeNull();
    });

    it("should not throw when calling methods on server side", () => {
      expect(() => {
        analytics.initialize();
        analytics.trackPageView({
          page_title: "Test Page",
          page_location: "https://example.com/test",
          page_path: "/test",
        });
        analytics.trackEvent({
          action: "test_action",
          category: "test_category",
        });
        analytics.trackNavigation("/test", "Test Page");
        analytics.trackLegalDocumentView("terms");
        analytics.trackCampaignView("Test Campaign");
        analytics.onConsentChange();
      }).not.toThrow();
    });
  });

  describe("SSR-specific Methods", () => {
    beforeEach(() => {
      // Mock minimal window for client-side tests
      (global as any).window = {
        location: { href: "https://example.com/test" },
        document: { title: "Test Page" },
      };
    });

    it("should have trackNavigation method for Next.js routing", () => {
      expect(typeof analytics.trackNavigation).toBe("function");
    });

    it("should have trackLegalDocumentView method for legal pages", () => {
      expect(typeof analytics.trackLegalDocumentView).toBe("function");
    });

    afterEach(() => {
      delete (global as any).window;
    });
  });

  describe("Type Safety", () => {
    it("should export expected interfaces", () => {
      // Test that TypeScript types are properly exported
      const event: import("@shared/services/analytics").AnalyticsEvent = {
        action: "test",
        category: "test",
        label: "test",
        value: 1,
      };

      const pageView: import("@shared/services/analytics").PageViewEvent = {
        page_title: "Test",
        page_location: "https://example.com",
        page_path: "/test",
      };

      expect(event).toBeDefined();
      expect(pageView).toBeDefined();
    });
  });
});
