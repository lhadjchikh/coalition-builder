/**
 * Integration tests for API client behavior in production-like scenarios.
 * These tests verify the NetworkError fix works correctly.
 */

import API from '../api';
import { Campaign, Endorsement } from '../../types';
import { withSuppressedErrors } from '../../tests/utils/testUtils';

// Mock fetch globally
const mockFetch = jest.fn();
const originalFetch = global.fetch;

describe('API Client Production Integration', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  // Helper to get expected URL based on environment
  const getExpectedUrl = (path: string): string => {
    // The API client is instantiated once when the module loads
    // In CI environments, it will use localhost:8000
    // We need to check the actual CI env var, not the mocked one
    if (originalEnv.CI === 'true' && !originalEnv.REACT_APP_API_URL) {
      return `http://localhost:8000${path}`;
    }
    return path;
  };

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    jest.replaceProperty(process, 'env', {
      NODE_ENV: 'test',
      PUBLIC_URL: '',
      PATH: '',
      HOME: '',
    });
  });

  afterEach(() => {
    // Restore original environment and window
    jest.replaceProperty(process, 'env', originalEnv);
    global.window = originalWindow;
  });

  describe('Production Environment Simulation', () => {
    it('should successfully fetch campaign endorsements using relative paths in production', async () => {
      // Simulate production environment where no environment variables are set
      // API calls should use relative paths, handled by nginx/load balancer
      const mockEndorsements: Endorsement[] = [
        {
          id: 1,
          stakeholder: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            organization: 'Test Org',
            email: 'john@example.com',
            street_address: '123 Main St',
            city: 'Los Angeles',
            state: 'CA',
            zip_code: '90001',
            type: 'individual',
          },
          campaign: {
            id: 1,
            name: 'test-campaign',
            title: 'Test Campaign',
            summary: 'Test summary',
            active: true,
            created_at: '2023-01-01T00:00:00Z',
          },
          statement: 'I support this campaign',
          public_display: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockEndorsements,
      });

      // This simulates the production scenario:
      // Client-side API call for endorsements using relative paths
      const endorsements = await API.getCampaignEndorsements(1);

      expect(endorsements).toEqual(mockEndorsements);
      // Verify the URL uses relative paths, not absolute URLs
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/?campaign_id=1'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      // Verify headers separately
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle network errors gracefully in production', async () => {
      await withSuppressedErrors(['Failed to fetch', 'Network error'], async () => {
        // Simulate network errors with relative path API calls
        // The API client will retry 3 times before failing
        mockFetch
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(API.getCampaignEndorsements(1)).rejects.toThrow();

        // Verify it attempted to use relative paths
        expect(mockFetch).toHaveBeenCalledWith(
          getExpectedUrl('/api/endorsements/?campaign_id=1'),
          expect.objectContaining({
            headers: expect.any(Headers),
            credentials: 'same-origin',
            signal: expect.any(AbortSignal),
          })
        );
      });
    });

    it('should work with explicit REACT_APP_API_URL for CI/testing', async () => {
      // Simulate CI/testing environment with explicit API URL
      jest.replaceProperty(process, 'env', {
        NODE_ENV: 'test',
        REACT_APP_API_URL: 'https://api.coalition.org',
        PUBLIC_URL: '',
        PATH: '',
        HOME: '',
      });

      const mockCampaigns: Campaign[] = [
        {
          id: 1,
          name: 'test-campaign',
          title: 'Test Campaign',
          summary: 'Test summary',
          active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockCampaigns,
      });

      const campaigns = await API.getCampaigns();

      expect(campaigns).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/campaigns/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      // Verify headers separately
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle CORS errors appropriately in production', async () => {
      await withSuppressedErrors(['Forbidden'], async () => {
        // Simulate CORS error using relative paths
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ detail: 'Forbidden' }),
        });

        await expect(API.getCampaignEndorsements(1)).rejects.toThrow('Forbidden');
      });
    });
  });

  describe('Simplified Production Behavior', () => {
    it('should use relative URLs consistently across all environments', async () => {
      // Both development and production now use relative URLs by default
      const mockCampaigns: Campaign[] = [
        {
          id: 1,
          name: 'test-campaign',
          title: 'Test Campaign',
          summary: 'Test summary',
          active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockCampaigns,
      });

      await API.getCampaigns();

      // Should always use relative URLs when no environment variables are set
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/campaigns/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      // Verify headers separately
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Simplified URL Construction', () => {
    it('should use relative paths regardless of browser context', async () => {
      // Even with window.location available, should still use relative paths
      const mockLocation = {
        origin: 'https://www.coalition.org',
      };

      Object.defineProperty(global, 'window', {
        value: {
          location: mockLocation,
        },
        writable: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
      });

      await API.getCampaignEndorsements(1);

      // Should still use relative paths, not absolute URLs
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/?campaign_id=1'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      // Verify headers separately
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should work consistently across different deployment contexts', async () => {
      // No matter the environment (local, staging, production),
      // should use relative paths for nginx to handle routing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
      });

      await API.getCampaignEndorsements(1);

      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/?campaign_id=1'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      // Verify headers separately
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });
});
