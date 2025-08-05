import API, { getBaseUrl } from '../api';
import {
  Campaign,
  Endorser,
  Legislator,
  Endorsement,
  EndorsementCreate,
  HomePage,
} from '../../types';
import { withSuppressedErrors } from '../../tests/utils/testUtils';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to match Headers objects in tests
const expectHeaders = (headers: any) => {
  // Check if it's a Headers instance with the correct Content-Type
  expect(headers).toBeInstanceOf(Headers);
  expect(headers.get('Content-Type')).toBe('application/json');
  return true;
};

// Helper to create mock response with headers
const createMockResponse = (
  body: any,
  options: { ok?: boolean; status?: number; contentType?: string } = {}
) => {
  const { ok = true, status = 200, contentType = 'application/json' } = options;
  return {
    ok,
    status,
    headers: {
      get: (name: string) => (name === 'content-type' ? contentType : null),
    },
    json: async () => body,
  };
};

describe('API Service', () => {
  const originalEnv = process.env;

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

  // Helper to create clean environment without CI variables affecting tests
  const createCleanEnv = (
    overrides: Record<string, string | undefined> = {}
  ): NodeJS.ProcessEnv => ({
    ...Object.fromEntries(
      Object.entries(originalEnv).filter(
        ([key]) => !['CI', 'NEXT_PUBLIC_API_URL', 'REACT_APP_API_URL'].includes(key)
      )
    ),
    // Ensure required properties are present for NodeJS.ProcessEnv
    NODE_ENV: originalEnv.NODE_ENV || 'test',
    PUBLIC_URL: originalEnv.PUBLIC_URL || '',
    PATH: originalEnv.PATH || '',
    HOME: originalEnv.HOME || '',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Start with clean environment for each test
    jest.replaceProperty(process, 'env', createCleanEnv());
    // Reset window to undefined for most tests (simulating SSR context)
    delete (global as any).window;
  });

  afterAll(() => {
    // Restore original environment
    jest.replaceProperty(process, 'env', originalEnv);
  });

  describe('getBaseUrl', () => {
    it('should return REACT_APP_API_URL when set', () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          REACT_APP_API_URL: 'https://react-api.example.com',
        })
      );
      expect(getBaseUrl()).toBe('https://react-api.example.com');
    });

    it('should return localhost:8000 when in CI environment', () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          CI: 'true',
        })
      );
      expect(getBaseUrl()).toBe('http://localhost:8000');
    });

    it('should return empty string for production and development (relative paths)', () => {
      // Default behavior: no environment variables set
      // Should return empty string for relative paths
      expect(getBaseUrl()).toBe('');
    });
  });

  describe('getCampaigns', () => {
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

    it('should fetch campaigns successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaigns));

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
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 404 }));

        await expect(API.getCampaigns()).rejects.toThrow('HTTP error! status: 404');
      });
    });

    it('should handle network failures', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        // All retry attempts fail
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'));

        await expect(API.getCampaigns()).rejects.toThrow('Network error');
      });
    });

    it('should use correct URL with explicit API URL', async () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          REACT_APP_API_URL: 'https://api.example.com',
        })
      );

      // Test the base URL logic directly since the client is already instantiated
      expect(getBaseUrl()).toBe('https://api.example.com');

      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaigns));

      await API.getCampaigns();
      // The actual client uses the base URL from instantiation time, not runtime
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/campaigns/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });
  });

  describe('getEndorsers', () => {
    const mockEndorsers: Endorser[] = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        organization: 'Test Org',
        email: 'john@example.com',
        state: 'CA',
        type: 'individual',
      },
    ];

    it('should fetch endorsers successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsers));

      const endorsers = await API.getEndorsers();
      expect(endorsers).toEqual(mockEndorsers);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsers/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 500 }));

        await expect(API.getEndorsers()).rejects.toThrow('HTTP error! status: 500');
      });
    });
  });

  describe('getLegislators', () => {
    const mockLegislators: Legislator[] = [
      {
        id: 1,
        first_name: 'Jane',
        last_name: 'Smith',
        chamber: 'Senate',
        state: 'CA',
      },
    ];

    it('should fetch legislators successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLegislators));

      const legislators = await API.getLegislators();
      expect(legislators).toEqual(mockLegislators);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/legislators/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 403'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 403 }));

        await expect(API.getLegislators()).rejects.toThrow('HTTP error! status: 403');
      });
    });
  });

  describe('getEndorsements', () => {
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

    it('should fetch endorsements successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      const endorsements = await API.getEndorsements();
      expect(endorsements).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 401'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 401 }));

        await expect(API.getEndorsements()).rejects.toThrow('HTTP error! status: 401');
      });
    });
  });

  describe('getCampaignEndorsements', () => {
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

    it('should fetch campaign endorsements successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      const endorsements = await API.getCampaignEndorsements(1);
      expect(endorsements).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/?campaign_id=1'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 404 }));

        await expect(API.getCampaignEndorsements(1)).rejects.toThrow('HTTP error! status: 404');
      });
    });

    it('should use relative URL for production (default behavior)', async () => {
      // Default behavior: no environment variables set
      // Should use relative paths in production

      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      await API.getCampaignEndorsements(1);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/?campaign_id=1'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });
  });

  describe('createEndorsement', () => {
    const mockEndorsementData: EndorsementCreate = {
      campaign_id: 1,
      stakeholder: {
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
      statement: 'I support this campaign',
      public_display: true,
      terms_accepted: true,
      org_authorized: true,
    };

    const mockCreatedEndorsement: Endorsement = {
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
    };

    beforeEach(() => {
      // Mock document.cookie to provide CSRF token
      // This avoids the need for the API to fetch the token
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'csrftoken=test-csrf-token',
      });
    });

    it('should create endorsement successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCreatedEndorsement));

      const endorsement = await API.createEndorsement(mockEndorsementData);
      expect(endorsement).toEqual(mockCreatedEndorsement);

      // Should have made 1 call (POST request, CSRF token from cookie)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Check the POST request
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/endorsements/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockEndorsementData),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );

      // Check headers
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-CSRFToken')).toBe('test-csrf-token');
    });

    it('should handle HTTP error responses with error details', async () => {
      await withSuppressedErrors(['Invalid endorsement data'], async () => {
        const errorData = { detail: 'Invalid endorsement data' };
        mockFetch.mockResolvedValueOnce(createMockResponse(errorData, { ok: false, status: 400 }));

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow(
          'Invalid endorsement data'
        );
      });
    });

    it('should handle HTTP error responses without error details', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 500 }));

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow(
          'HTTP error! status: 500'
        );
      });
    });

    it('should handle network failures during creation', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        // All retry attempts fail
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'));

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow('Network error');
      });
    });
  });

  describe('getCampaignById', () => {
    const mockCampaign: Campaign = {
      id: 1,
      name: 'test-campaign',
      title: 'Test Campaign',
      summary: 'Test summary',
      active: true,
      created_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch campaign by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaign));

      const campaign = await API.getCampaignById(1);
      expect(campaign).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/campaigns/1/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 404 }));

        await expect(API.getCampaignById(1)).rejects.toThrow('HTTP error! status: 404');
      });
    });
  });

  describe('getCampaignByName', () => {
    const mockCampaign: Campaign = {
      id: 1,
      name: 'test-campaign',
      title: 'Test Campaign',
      summary: 'Test summary',
      active: true,
      created_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch campaign by name successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaign));

      const campaign = await API.getCampaignByName('test-campaign');
      expect(campaign).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/campaigns/by-name/test-campaign/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );
      expectHeaders(mockFetch.mock.calls[0][1].headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 404 }));

        await expect(API.getCampaignByName('nonexistent')).rejects.toThrow(
          'HTTP error! status: 404'
        );
      });
    });
  });

  describe('getHomepage', () => {
    const mockHomepage: HomePage = {
      id: 1,
      organization_name: 'Test Org',
      tagline: 'Test tagline',
      hero_title: 'Hero Title',
      hero_subtitle: 'Hero Subtitle',
      hero_background_image_url: 'hero.jpg',
      hero_overlay_enabled: true,
      hero_overlay_color: '#000000',
      hero_overlay_opacity: 0.4,
      cta_title: 'CTA Title',
      cta_content: 'CTA content',
      cta_button_text: 'Click me',
      cta_button_url: 'https://example.com',
      campaigns_section_title: 'Our Campaigns',
      show_campaigns_section: true,
      facebook_url: 'https://facebook.com/test',
      twitter_url: 'https://twitter.com/test',
      instagram_url: 'https://instagram.com/test',
      linkedin_url: 'https://linkedin.com/test',
      campaigns_section_subtitle: 'Our campaigns',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch homepage successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHomepage));

      const homepage = await API.getHomepage();
      expect(homepage).toEqual(mockHomepage);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl('/api/homepage/'),
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'same-origin',
          signal: expect.any(AbortSignal),
        })
      );

      // Verify headers separately
      const callArgs = mockFetch.mock.calls[0][1];
      expectHeaders(callArgs.headers);
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 500 }));

        await expect(API.getHomepage()).rejects.toThrow('HTTP error! status: 500');
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed JSON responses', async () => {
      await withSuppressedErrors(['Invalid JSON'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => (name === 'content-type' ? 'application/json' : null),
          },
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(API.getCampaigns()).rejects.toThrow('Invalid JSON');
      });
    });

    it('should handle fetch rejections', async () => {
      await withSuppressedErrors(['Fetch failed'], async () => {
        // All retry attempts fail
        mockFetch
          .mockRejectedValueOnce(new Error('Fetch failed'))
          .mockRejectedValueOnce(new Error('Fetch failed'))
          .mockRejectedValueOnce(new Error('Fetch failed'));

        await expect(API.getCampaigns()).rejects.toThrow('Fetch failed');
      });
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null));

      const campaigns = await API.getCampaigns();
      expect(campaigns).toBeNull();
    });
  });

  describe('Retry logic', () => {
    it('should retry on network error and succeed on second attempt', async () => {
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

      // First attempt fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(mockCampaigns));

      const campaigns = await API.getCampaigns();
      expect(campaigns).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry up to 3 times before failing', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        // All attempts fail
        mockFetch
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'));

        await expect(API.getCampaigns()).rejects.toThrow('Network error');
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it('should not retry on non-network errors', async () => {
      await withSuppressedErrors(['HTTP error! status: 400'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 400 }));

        await expect(API.getCampaigns()).rejects.toThrow('HTTP error! status: 400');
        expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
      });
    });
  });

  describe('Timeout functionality', () => {
    it('should timeout requests after 30 seconds', async () => {
      await withSuppressedErrors(['Request timeout'], async () => {
        jest.useFakeTimers();

        // Mock a hanging request that never resolves
        let capturedSignal: AbortSignal | undefined;
        const abortError = Object.assign(new Error('The operation was aborted'), {
          name: 'AbortError',
        });

        mockFetch.mockImplementationOnce((url, options) => {
          capturedSignal = options?.signal;

          // Return a promise that rejects when aborted
          return new Promise((resolve, reject) => {
            capturedSignal?.addEventListener('abort', () => {
              reject(abortError);
            });
          });
        });

        const promise = API.getCampaigns();

        // Wait a bit for the request to be initiated
        await Promise.resolve();

        // Fast-forward 30 seconds
        jest.advanceTimersByTime(30000);

        jest.useRealTimers();

        await expect(promise).rejects.toThrow('Request timeout');
      });
    });

    it('should abort request on timeout', async () => {
      await withSuppressedErrors(['Request timeout'], async () => {
        jest.useFakeTimers();

        let capturedSignal: AbortSignal | undefined;
        const abortError = Object.assign(new Error('The operation was aborted'), {
          name: 'AbortError',
        });

        mockFetch.mockImplementationOnce((url, options) => {
          capturedSignal = options?.signal;

          // Return a promise that rejects when aborted
          return new Promise((resolve, reject) => {
            capturedSignal?.addEventListener('abort', () => {
              reject(abortError);
            });
          });
        });

        const promise = API.getCampaigns();

        // Wait a bit for the request to be initiated
        await Promise.resolve();

        // Verify signal exists and is not aborted initially
        expect(capturedSignal).toBeDefined();
        expect(capturedSignal?.aborted).toBe(false);

        // Fast-forward 30 seconds
        jest.advanceTimersByTime(30000);

        // Signal should now be aborted
        expect(capturedSignal?.aborted).toBe(true);

        jest.useRealTimers();

        await expect(promise).rejects.toThrow('Request timeout');
      });
    });
  });

  describe('Console logging', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log errors when requests fail', async () => {
      const error = new Error('Network error');
      // All retry attempts fail
      mockFetch
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      await expect(API.getCampaigns()).rejects.toThrow('Network error');
      // Should see final failure
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API request failed for %s:',
        getExpectedUrl('/api/campaigns/'),
        error
      );
    });

    it('should log errors when endorsement creation fails', async () => {
      const error = new Error('Creation failed');
      // All retry attempts fail
      mockFetch
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const endorsementData: EndorsementCreate = {
        campaign_id: 1,
        stakeholder: {
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
        statement: 'I support this campaign',
        public_display: true,
        terms_accepted: true,
        org_authorized: true,
      };

      await expect(API.createEndorsement(endorsementData)).rejects.toThrow('Creation failed');
      // Should see final failure
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API request failed for %s:',
        getExpectedUrl('/api/endorsements/'),
        error
      );
    });

    // Skip this test - API client is already initialized before the test runs
    it.skip('should log API base URL construction in development', async () => {
      // The API client is initialized when the module loads,
      // so we can't test the initialization logging in this way
    });
  });

  describe('Request options', () => {
    it('should include credentials same-origin', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));

      await API.getCampaigns();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'same-origin',
        })
      );
    });

    it('should include signal for abort controller', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));

      await API.getCampaigns();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
