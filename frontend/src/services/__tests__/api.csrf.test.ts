/**
 * Tests for CSRF token handling in the frontend API client
 */

import { frontendApiClient } from '@services/api';

// Mock fetch globally
global.fetch = jest.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Frontend API Client CSRF Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = '';
    // Reset the CSRF token in the client
    (frontendApiClient as any).csrfToken = null;
    (frontendApiClient as any).csrfTokenPromise = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CSRF Token from Cookie', () => {
    it('should get CSRF token from cookie when available', async () => {
      // Set a CSRF token in the cookie
      document.cookie = 'csrftoken=test-csrf-token-from-cookie';

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      // Make a POST request
      await frontendApiClient.post('/api/test/', { test: 'data' });

      // Check that fetch was called with the CSRF token
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers),
          method: 'POST',
        })
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.get('X-CSRFToken')).toBe('test-csrf-token-from-cookie');
    });

    it('should handle cookie with spaces and semicolons correctly', async () => {
      // Set multiple cookies with spaces
      document.cookie = 'sessionid=123; Secure; csrftoken=token-with-spaces; Secure; other=value';

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      // Make a POST request
      await frontendApiClient.post('/api/test/', { test: 'data' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.get('X-CSRFToken')).toBe('token-with-spaces');
    });
  });

  describe('CSRF Token from Endpoint', () => {
    it('should fetch CSRF token from endpoint when no cookie available', async () => {
      // No cookie set
      document.cookie = '';

      // Mock CSRF token endpoint response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ csrf_token: 'test-csrf-token-from-endpoint' }),
      });

      // Mock actual API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      // Make a POST request
      await frontendApiClient.post('/api/test/', { test: 'data' });

      // Should have made two fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // First call should be to CSRF endpoint
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/api/csrf-token/');

      // Second call should include the CSRF token
      const headers = (global.fetch as jest.Mock).mock.calls[1][1].headers;
      expect(headers.get('X-CSRFToken')).toBe('test-csrf-token-from-endpoint');
    });

    it('should reuse fetched CSRF token for subsequent requests', async () => {
      document.cookie = '';

      // Mock implementation that handles CSRF token fetch and API calls
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(url => {
        callCount++;
        if (url.includes('/api/csrf-token/')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ csrf_token: 'reusable-csrf-token' }),
          });
        } else if (url.includes('/api/test1/')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ data: 'test1' }),
          });
        } else if (url.includes('/api/test2/')) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ data: 'test2' }),
          });
        }
        return Promise.reject(new Error('Unexpected URL: ' + url));
      });

      // Make two POST requests
      await frontendApiClient.post('/api/test1/', { test: 'data1' });
      await frontendApiClient.post('/api/test2/', { test: 'data2' });

      // Check all calls made
      const calls = (global.fetch as jest.Mock).mock.calls;

      // Find the CSRF token call and API calls
      const csrfCall = calls.find(call => call[0].includes('/api/csrf-token/'));
      const apiCalls = calls.filter(call => !call[0].includes('/api/csrf-token/'));

      // Should have one CSRF call and at least 2 API calls
      expect(csrfCall).toBeDefined();
      expect(apiCalls.length).toBeGreaterThanOrEqual(2);

      // Both API calls should use the same token
      const apiCallsWithToken = apiCalls.filter(call => call[1]?.headers?.get('X-CSRFToken'));
      expect(apiCallsWithToken.length).toBeGreaterThanOrEqual(2);
      apiCallsWithToken.forEach(call => {
        expect(call[1].headers.get('X-CSRFToken')).toBe('reusable-csrf-token');
      });
    });

    it('should handle CSRF token fetch failure gracefully', async () => {
      document.cookie = '';

      // Mock failed CSRF token endpoint response
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock actual API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      // Make a POST request - should still work even without CSRF token
      await frontendApiClient.post('/api/test/', { test: 'data' });

      // Should have made two fetch calls
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Second call should not have CSRF token (null)
      const headers = (global.fetch as jest.Mock).mock.calls[1][1].headers;
      expect(headers.get('X-CSRFToken')).toBeNull();
    });
  });

  describe('Request Methods', () => {
    it('should not add CSRF token for GET requests', async () => {
      document.cookie = 'csrftoken=test-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await frontendApiClient.get('/api/test/');

      // Should not fetch CSRF token for GET
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('X-CSRFToken')).toBeNull();
    });

    it('should add CSRF token for POST requests', async () => {
      document.cookie = 'csrftoken=post-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await frontendApiClient.post('/api/test/', { data: 'test' });

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('X-CSRFToken')).toBe('post-token');
    });

    it('should add CSRF token for PUT requests', async () => {
      document.cookie = 'csrftoken=put-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await frontendApiClient.put('/api/test/1/', { data: 'test' });

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('X-CSRFToken')).toBe('put-token');
    });

    it('should add CSRF token for DELETE requests', async () => {
      document.cookie = 'csrftoken=delete-token';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await frontendApiClient.delete('/api/test/1/');

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('X-CSRFToken')).toBe('delete-token');
    });
  });

  describe('Concurrent CSRF Token Fetching', () => {
    it('should handle concurrent CSRF token requests', async () => {
      document.cookie = '';

      // Mock CSRF token endpoint to return after a delay
      let resolveToken: (value: any) => void;
      const tokenPromise = new Promise(resolve => {
        resolveToken = resolve;
      });

      (global.fetch as jest.Mock).mockImplementation(url => {
        if (url.includes('/api/csrf-token/')) {
          return tokenPromise;
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'test' }),
        });
      });

      // Start two concurrent POST requests
      const request1 = frontendApiClient.post('/api/test1/', { data: 1 });
      const request2 = frontendApiClient.post('/api/test2/', { data: 2 });

      // Resolve the CSRF token fetch
      resolveToken!({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ csrf_token: 'concurrent-token' }),
      });

      // Wait for both requests to complete
      await Promise.all([request1, request2]);

      // Should have fetched CSRF token only once
      const csrfCalls = (global.fetch as jest.Mock).mock.calls.filter(call =>
        call[0].includes('/api/csrf-token/')
      );
      expect(csrfCalls.length).toBe(1);
    });
  });

  describe('Integration Test - 403 Detection', () => {
    it('should detect 403 errors when CSRF token is missing', async () => {
      document.cookie = ''; // No CSRF token

      // Mock CSRF endpoint failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Mock 403 response for POST without CSRF
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'CSRF token missing or incorrect' }),
      });

      // Try to make a POST request
      await expect(frontendApiClient.post('/api/endorsements/', { data: 'test' })).rejects.toThrow(
        'CSRF token missing or incorrect'
      );
    });

    it('should succeed when CSRF token is properly configured', async () => {
      document.cookie = 'csrftoken=valid-token';

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, status: 'created' }),
      });

      const result = await frontendApiClient.post('/api/endorsements/', {
        statement: 'Test',
      });

      expect(result).toEqual({ id: 1, status: 'created' });

      // Verify CSRF token was sent
      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.get('X-CSRFToken')).toBe('valid-token');
    });
  });
});
