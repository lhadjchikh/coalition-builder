"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import analytics from "@shared/services/analytics";

/**
 * Google Analytics component for Next.js SSR application.
 *
 * This component:
 * - Loads the Google Analytics script
 * - Initializes analytics when the app loads
 * - Tracks route changes automatically
 * - Respects cookie consent preferences
 * - Only renders script tags when tracking ID is available
 */
export default function GoogleAnalytics(): React.JSX.Element | null {
  const pathname = usePathname();
  const trackingId = analytics.getTrackingId();

  // Track route changes
  useEffect(() => {
    if (pathname) {
      analytics.trackNavigation(pathname);
    }
  }, [pathname]);

  // Initialize analytics on mount
  useEffect(() => {
    analytics.initialize();

    // Listen for cookie consent changes
    const handleConsentChange = () => {
      analytics.onConsentChange();
    };

    // Listen for the CookieConsent library's consent change events
    if (typeof window !== "undefined") {
      window.addEventListener("cc:onConsentChange", handleConsentChange);

      // Cleanup event listener on unmount
      return () => {
        window.removeEventListener("cc:onConsentChange", handleConsentChange);
      };
    }
  }, []);

  // Don't render anything if no tracking ID is configured
  if (!trackingId) {
    return null;
  }

  return (
    <>
      {/* Load Google Analytics script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
        strategy="afterInteractive"
      />

      {/* Initialize Google Analytics */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Note: We don't call gtag('config') here because our analytics service
          // handles initialization with proper cookie consent checking
        `}
      </Script>
    </>
  );
}
