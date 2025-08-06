import API from '@services/api';
import { withSuppressedErrors } from '@tests/utils/testUtils';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

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

describe('API Retry and Timeout Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window to undefined for most tests (simulating SSR context)
    delete (global as any).window;
  });

  describe('Retry logic', () => {
    it('should retry on network error and succeed on second attempt', async () => {
      const mockCampaigns = [
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

    it('should not retry on HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 400'], async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 400 }));

        await expect(API.getCampaigns()).rejects.toThrow('HTTP error! status: 400');
        expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
      });
    });

    it('should retry on TypeError (often network issues)', async () => {
      const mockCampaigns = [{ id: 1, name: 'test', title: 'Test', summary: 'Test', active: true }];

      // First attempt fails with TypeError, second succeeds
      const typeError = new TypeError('Failed to fetch');
      mockFetch
        .mockRejectedValueOnce(typeError)
        .mockResolvedValueOnce(createMockResponse(mockCampaigns));

      const campaigns = await API.getCampaigns();
      expect(campaigns).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should wait 1 second between retry attempts', async () => {
      // This test verifies the retry delay without using fake timers
      const mockCampaigns = [{ id: 1, name: 'test', title: 'Test', summary: 'Test', active: true }];

      let firstCallTime: number | null = null;
      let secondCallTime: number | null = null;

      mockFetch
        .mockImplementationOnce(() => {
          firstCallTime = Date.now();
          return Promise.reject(new Error('Network error'));
        })
        .mockImplementationOnce(() => {
          secondCallTime = Date.now();
          return Promise.resolve(createMockResponse(mockCampaigns));
        });

      const result = await API.getCampaigns();

      expect(result).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify there was approximately 1 second delay between calls
      const delay = secondCallTime! - firstCallTime!;
      expect(delay).toBeGreaterThanOrEqual(900); // Allow some margin
      expect(delay).toBeLessThan(1200);
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

    it('should include AbortSignal in all requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));

      await API.getCampaigns();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should log timeout errors with URL and duration', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock abort error
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(API.getCampaigns()).rejects.toThrow('Request timeout');

      expect(consoleSpy).toHaveBeenCalledWith(
        'API request timed out for %s after %dms',
        expect.stringContaining('/api/campaigns/'),
        expect.any(Number)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Console logging', () => {
    let consoleSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log retry attempts', async () => {
      // First attempt fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse([]));

      await API.getCampaigns();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Network error for %s - retrying in %dms (attempt %d/%d)',
        expect.stringContaining('/api/campaigns/'),
        1000, // retry delay
        1, // attempt number
        3 // max retries
      );
    });

    it('should log final failure after all retries', async () => {
      const error = new Error('Network error');

      // All attempts fail
      mockFetch
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      try {
        await API.getCampaigns();
        fail('Expected error to be thrown');
      } catch (e) {
        expect(e).toEqual(error);
      }

      // Should see 2 retry warnings (for attempts 1 and 2)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      // The final error should be logged
      expect(consoleSpy).toHaveBeenCalled();

      // Verify the error was logged with the correct format
      const hasApiFailureLog = consoleSpy.mock.calls.some(
        call =>
          call[0] === 'API request failed for %s:' &&
          typeof call[1] === 'string' &&
          call[1].includes('/api/campaigns/')
      );
      expect(hasApiFailureLog).toBe(true);
    });
  });
});
