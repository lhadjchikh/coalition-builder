import React, { useEffect } from 'react';
import analytics from '../services/analytics';

/**
 * Google Analytics initialization component.
 *
 * This component:
 * - Initializes Google Analytics when the app loads
 * - Respects cookie consent preferences
 * - Listens for consent changes to re-initialize if needed
 * - Renders nothing (invisible component)
 */
const GoogleAnalytics: React.FC = () => {
  useEffect(() => {
    // Initialize analytics on component mount
    analytics.initialize();

    // Listen for cookie consent changes
    const handleConsentChange = () => {
      analytics.onConsentChange();
    };

    // Listen for the CookieConsent library's consent change events
    if (typeof window !== 'undefined') {
      window.addEventListener('cc:onConsentChange', handleConsentChange);

      // Cleanup event listener on unmount
      return () => {
        window.removeEventListener('cc:onConsentChange', handleConsentChange);
      };
    }
  }, []);

  // This component renders nothing
  return null;
};

export default GoogleAnalytics;
