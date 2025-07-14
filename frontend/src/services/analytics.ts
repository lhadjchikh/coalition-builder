/**
 * Google Analytics service for tracking user interactions and page views.
 *
 * This service:
 * - Respects cookie consent preferences
 * - Only tracks when analytics cookies are enabled
 * - Provides a clean API for tracking events
 * - Handles GA initialization and configuration
 */

import type {
  AnalyticsEvent,
  PageViewEvent,
  GtagCommand,
  AnalyticsWindow,
} from '@shared/types/analytics';

declare global {
  interface Window extends AnalyticsWindow {}
}

export type { AnalyticsEvent, PageViewEvent };

class AnalyticsService {
  private trackingId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.trackingId =
      process.env.REACT_APP_GA_TRACKING_ID || process.env.NEXT_PUBLIC_GA_TRACKING_ID || null;
  }

  /**
   * Get the tracking ID (for testing purposes)
   */
  getTrackingId(): string | null {
    return this.trackingId;
  }

  /**
   * Initialize Google Analytics if tracking ID is provided and analytics cookies are enabled
   */
  async initialize(): Promise<void> {
    if (!this.trackingId || this.isInitialized) {
      return;
    }

    // Check if analytics cookies are enabled
    if (!this.isAnalyticsEnabled()) {
      console.log('Analytics cookies not enabled, skipping GA initialization');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
      document.head.appendChild(script);

      // Initialize dataLayer and gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        (function gtag(command: string, ...args: unknown[]) {
          window.dataLayer.push([command, ...args]);
        } as GtagCommand);

      // Configure Google Analytics
      window.gtag('js', new Date());
      window.gtag('config', this.trackingId, {
        anonymize_ip: true, // Privacy compliance
        cookie_flags: 'SameSite=Strict;Secure', // Security
      });

      this.isInitialized = true;
      console.log('Google Analytics initialized with ID:', this.trackingId);
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(event: PageViewEvent): void {
    if (!this.isInitialized || !this.isAnalyticsEnabled()) {
      return;
    }

    window.gtag('event', 'page_view', {
      page_title: event.page_title,
      page_location: event.page_location,
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized || !this.isAnalyticsEnabled()) {
      return;
    }

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }

  /**
   * Track endorsement submission
   */
  trackEndorsementSubmission(campaignName: string): void {
    this.trackEvent({
      action: 'submit_endorsement',
      category: 'engagement',
      label: campaignName,
    });
  }

  /**
   * Track campaign view
   */
  trackCampaignView(campaignName: string): void {
    this.trackEvent({
      action: 'view_campaign',
      category: 'engagement',
      label: campaignName,
    });
  }

  /**
   * Track form interaction
   */
  trackFormInteraction(formName: string, action: string): void {
    this.trackEvent({
      action: action,
      category: 'form_interaction',
      label: formName,
    });
  }

  /**
   * Check if analytics cookies are enabled by checking cookie consent
   */
  private isAnalyticsEnabled(): boolean {
    // Check if the vanilla-cookieconsent analytics category is enabled
    if (typeof window !== 'undefined' && window.CookieConsent) {
      try {
        return window.CookieConsent.acceptedCategory('analytics');
      } catch (error) {
        console.warn('Could not check analytics cookie consent:', error);
      }
    }

    // Fallback: check for explicit analytics cookie
    if (typeof document !== 'undefined') {
      return document.cookie.includes('analytics_consent=true');
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
export const analytics = new AnalyticsService();
export default analytics;
