/**
 * Google Analytics service for Next.js SSR application.
 *
 * This service:
 * - Handles both server-side and client-side analytics
 * - Respects cookie consent preferences
 * - Only tracks when analytics cookies are enabled
 * - Provides page view and event tracking
 * - Integrates with the existing cookie consent system
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    CookieConsent?: {
      acceptedCategory: (category: string) => boolean;
    };
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

class SSRAnalyticsService {
  private trackingId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.trackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID || null;
  }

  /**
   * Get the tracking ID for server-side rendering
   */
  getTrackingId(): string | null {
    return this.trackingId;
  }

  /**
   * Initialize Google Analytics (client-side only)
   */
  async initialize(): Promise<void> {
    // Only run on client side
    if (
      typeof window === "undefined" ||
      !this.trackingId ||
      this.isInitialized
    ) {
      return;
    }

    // Check if analytics cookies are enabled
    if (!this.isAnalyticsEnabled()) {
      console.log("Analytics cookies not enabled, skipping GA initialization");
      return;
    }

    try {
      // Initialize dataLayer and gtag if not already present
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        };

      // Configure Google Analytics
      window.gtag("js", new Date());
      window.gtag("config", this.trackingId, {
        anonymize_ip: true, // Privacy compliance
        cookie_flags: "SameSite=Strict;Secure", // Security
        send_page_view: false, // We'll handle page views manually for Next.js routing
      });

      this.isInitialized = true;
      console.log("Google Analytics initialized with ID:", this.trackingId);
    } catch (error) {
      console.error("Failed to initialize Google Analytics:", error);
    }
  }

  /**
   * Track a page view (client-side only)
   */
  trackPageView(event: PageViewEvent): void {
    if (
      typeof window === "undefined" ||
      !this.isInitialized ||
      !this.isAnalyticsEnabled()
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      page_title: event.page_title,
      page_location: event.page_location,
      page_path: event.page_path,
    });
  }

  /**
   * Track a custom event (client-side only)
   */
  trackEvent(event: AnalyticsEvent): void {
    if (
      typeof window === "undefined" ||
      !this.isInitialized ||
      !this.isAnalyticsEnabled()
    ) {
      return;
    }

    window.gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  /**
   * Track page navigation for Next.js router
   */
  trackNavigation(url: string, title?: string): void {
    this.trackPageView({
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: url,
    });
  }

  /**
   * Track legal document views
   */
  trackLegalDocumentView(documentType: "terms" | "privacy"): void {
    this.trackEvent({
      action: "view_legal_document",
      category: "legal",
      label: documentType,
    });
  }

  /**
   * Track campaign page views
   */
  trackCampaignView(campaignName: string): void {
    this.trackEvent({
      action: "view_campaign",
      category: "engagement",
      label: campaignName,
    });
  }

  /**
   * Check if analytics cookies are enabled by checking cookie consent
   */
  private isAnalyticsEnabled(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    // Check if the vanilla-cookieconsent analytics category is enabled
    if (window.CookieConsent) {
      try {
        return window.CookieConsent.acceptedCategory("analytics");
      } catch (error) {
        console.warn("Could not check analytics cookie consent:", error);
      }
    }

    // Fallback: check for explicit analytics cookie
    if (typeof document !== "undefined") {
      return document.cookie.includes("analytics_consent=true");
    }

    return false;
  }

  /**
   * Re-initialize analytics when cookie consent changes
   */
  onConsentChange(): void {
    if (this.isAnalyticsEnabled() && !this.isInitialized) {
      this.initialize();
    }
  }
}

// Export singleton instance
export const analytics = new SSRAnalyticsService();
export default analytics;
