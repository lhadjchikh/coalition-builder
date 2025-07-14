/**
 * Tests for the analytics service
 */

// Mock environment variable before importing
process.env.REACT_APP_GA_TRACKING_ID = 'G-TEST123456';

import analytics from '../analytics';

// Mock the environment variable
const mockEnv = {
  REACT_APP_GA_TRACKING_ID: 'G-TEST123456',
};

// Mock window object and console
const mockWindow = {
  gtag: jest.fn(),
  dataLayer: [],
  CookieConsent: {
    acceptedCategory: jest.fn().mockReturnValue(true),
  },
};

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Store original console for restoration
const originalConsole = global.console;

describe('Analytics Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset mock return values
    mockWindow.CookieConsent.acceptedCategory.mockReturnValue(true);

    // Set up environment
    process.env = { ...process.env, ...mockEnv };

    // Reset the analytics service to pick up new environment
    (analytics as any)._resetForTesting();

    // Mock window properties
    (window as any).gtag = mockWindow.gtag;
    (window as any).dataLayer = mockWindow.dataLayer;
    (window as any).CookieConsent = mockWindow.CookieConsent;

    // Mock console
    global.console = mockConsole as any;

    // Mock document.createElement for script loading
    const mockScript = {
      async: false,
      src: '',
    };
    const mockHead = {
      appendChild: jest.fn(),
    };
    Object.defineProperty(document, 'createElement', {
      value: jest.fn().mockReturnValue(mockScript),
      writable: true,
    });
    Object.defineProperty(document, 'head', {
      value: mockHead,
      writable: true,
    });
  });

  describe('initialization', () => {
    it('should get tracking ID from environment', () => {
      expect(analytics.getTrackingId()).toBe('G-TEST123456');
    });

    it('should not initialize without tracking ID', async () => {
      process.env.REACT_APP_GA_TRACKING_ID = '';
      process.env.NEXT_PUBLIC_GA_TRACKING_ID = '';

      await analytics.initialize();

      expect(mockConsole.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Google Analytics initialized')
      );
    });

    it('should not initialize without analytics consent', async () => {
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(false);

      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Analytics cookies not enabled, skipping GA initialization'
      );
    });

    it('should initialize with tracking ID and consent', async () => {
      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Google Analytics initialized with ID:',
        'G-TEST123456'
      );
    });
  });

  describe('event tracking', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('should track page views', () => {
      analytics.trackPageView({
        page_title: 'Test Page',
        page_location: 'https://example.com/test',
        page_path: '/test',
      });

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Test Page',
        page_location: 'https://example.com/test',
        page_path: '/test',
      });
    });

    it('should track custom events', () => {
      analytics.trackEvent({
        action: 'test_action',
        category: 'test_category',
        label: 'test_label',
        value: 42,
      });

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: 'test_label',
        value: 42,
      });
    });

    it('should track endorsement submissions', () => {
      analytics.trackEndorsementSubmission('Test Campaign');

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'submit_endorsement', {
        event_category: 'engagement',
        event_label: 'Test Campaign',
        value: undefined,
      });
    });

    it('should track campaign views', () => {
      analytics.trackCampaignView('Test Campaign');

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'view_campaign', {
        event_category: 'engagement',
        event_label: 'Test Campaign',
        value: undefined,
      });
    });

    it('should track form interactions', () => {
      analytics.trackFormInteraction('endorsement_form', 'form_focus');

      expect(mockWindow.gtag).toHaveBeenCalledWith('event', 'form_focus', {
        event_category: 'form_interaction',
        event_label: 'endorsement_form',
        value: undefined,
      });
    });
  });

  describe('consent handling', () => {
    it('should not track when analytics consent is disabled', () => {
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(false);

      analytics.trackEvent({
        action: 'test_action',
        category: 'test_category',
      });

      expect(mockWindow.gtag).not.toHaveBeenCalled();
    });

    it('should reinitialize on consent change', async () => {
      // Initially no consent
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(false);
      await analytics.initialize();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Analytics cookies not enabled, skipping GA initialization'
      );

      // Consent granted
      mockWindow.CookieConsent.acceptedCategory.mockReturnValue(true);
      analytics.onConsentChange();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Google Analytics initialized with ID:',
        'G-TEST123456'
      );
    });
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
  });
});
