/**
 * Unified Google Analytics service for both frontend and SSR applications.
 *
 * This service:
 * - Works in both React and Next.js environments
 * - Handles both server-side and client-side analytics
 * - Respects cookie consent preferences
 * - Only tracks when analytics cookies are enabled
 * - Provides page view and event tracking
 * - Integrates with the existing cookie consent system
 */

import type {
  AnalyticsEvent,
  PageViewEvent,
  GtagCommand,
  AnalyticsWindow,
} from "@shared/types/analytics";

declare global {
  interface Window extends AnalyticsWindow {}
}

export type { AnalyticsEvent, PageViewEvent };

class UnifiedAnalyticsService {
  private trackingId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.trackingId =
      process.env.REACT_APP_GA_TRACKING_ID ||
      process.env.NEXT_PUBLIC_GA_TRACKING_ID ||
      null;
  }

  /**
   * Get the tracking ID
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
      console.debug(
        "Analytics cookies not enabled, skipping GA initialization",
      );
      return;
    }

    try {
      // Initialize dataLayer and gtag if not already present
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        (function gtag(command: string, ...args: unknown[]) {
          window.dataLayer.push([command, ...args]);
        } as GtagCommand);

      // Load GA script if not already loaded (for non-SSR environments)
      // In SSR environments, the GoogleAnalytics component handles script loading
      if (
        typeof document !== "undefined" &&
        !document.querySelector(`script[src*="gtag/js?id=${this.trackingId}"]`)
      ) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
        document.head.appendChild(script);
      }

      // Configure Google Analytics
      window.gtag("js", new Date());
      window.gtag("config", this.trackingId, {
        anonymize_ip: true, // Privacy compliance
        cookie_flags: "SameSite=Strict;Secure", // Security
        send_page_view: false, // Prevent automatic pageview tracking
      });

      this.isInitialized = true;
      console.debug("Google Analytics initialized with ID:", this.trackingId);
    } catch (error) {
      console.error("Failed to initialize Google Analytics:", error);
    }
  }

  /**
   * Track a page view
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
   * Track a custom event
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
   * Track page navigation for Next.js router (SSR environments)
   */
  trackNavigation(url: string, title?: string): void {
    if (typeof window === "undefined") {
      return;
    }

    this.trackPageView({
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: url,
    });
  }

  /**
   * Track endorsement submission
   */
  trackEndorsementSubmission(campaignName: string): void {
    this.trackEvent({
      action: "submit_endorsement",
      category: "engagement",
      label: campaignName,
    });
  }

  /**
   * Track campaign view
   */
  trackCampaignView(campaignName: string): void {
    this.trackEvent({
      action: "view_campaign",
      category: "engagement",
      label: campaignName,
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
   * Track form interaction (frontend specific)
   */
  trackFormInteraction(formName: string, action: string): void {
    this.trackEvent({
      action: action,
      category: "form_interaction",
      label: formName,
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
        if (process.env.NODE_ENV === "development") {
          console.warn("Could not check analytics cookie consent:", error);
        }
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

  /**
   * Reset service state for testing
   * @internal
   */
  _resetForTesting(): void {
    this.trackingId =
      process.env.REACT_APP_GA_TRACKING_ID ||
      process.env.NEXT_PUBLIC_GA_TRACKING_ID ||
      null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const analytics = new UnifiedAnalyticsService();
export default analytics;
