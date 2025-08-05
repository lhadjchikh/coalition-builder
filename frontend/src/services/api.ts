/**
 * Frontend API client that extends the shared base client
 * Handles frontend-specific URL resolution and error handling
 */

import { BaseApiClient } from '@shared/services/api-client';

// Re-export ContentBlock type from shared types
export type { ContentBlock } from '@shared/types';

// Determine the API base URL for frontend
const getBaseUrl = (): string => {
  // For CI/E2E tests with explicit URLs (e.g., docker-compose services)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // CI environment with localhost
  if (process.env.CI === 'true') {
    return 'http://localhost:8000';
  }

  // Production and development: use relative paths
  // Nginx/load balancer handles routing /api/* requests to backend
  // This works in both local development and ECS production environments
  return '';
};

// Helper function to get CSRF token from cookies
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  
  return null;
}

class FrontendApiClient extends BaseApiClient {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private csrfToken: string | null = null;
  private csrfTokenPromise: Promise<string | null> | null = null;

  constructor() {
    super({ baseURL: getBaseUrl() });
    // Fetch CSRF token on initialization
    this.fetchCsrfToken();
  }

  private async fetchCsrfToken(): Promise<string | null> {
    // If already fetching, return the existing promise
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    // First try to get from cookie
    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) {
      this.csrfToken = cookieToken;
      return cookieToken;
    }

    // If no cookie (cookies disabled or first load), fetch from endpoint
    this.csrfTokenPromise = fetch(`${this.baseURL}/api/csrf-token/`, {
      credentials: 'same-origin',
    })
      .then(response => response.json())
      .then(data => {
        this.csrfToken = data.csrf_token;
        return data.csrf_token;
      })
      .catch(error => {
        console.error('Failed to fetch CSRF token:', error);
        return null;
      })
      .finally(() => {
        this.csrfTokenPromise = null;
      });

    return this.csrfTokenPromise;
  }

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options);
  }

  // Public HTTP methods for testing and general use
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Log URL construction for debugging
    if (!this.baseURL && typeof window !== 'undefined') {
      console.debug('API request using relative URL:', endpoint);
    }

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Prepare headers
      const headers = new Headers(this.defaultHeaders);
      
      // Add CSRF token for state-changing requests
      const method = options?.method?.toUpperCase() || 'GET';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Ensure we have a CSRF token
        await this.fetchCsrfToken();
        if (this.csrfToken) {
          headers.set('X-CSRFToken', this.csrfToken);
        }
      }
      
      // Merge with any headers from options
      if (options?.headers) {
        const optionHeaders = new Headers(options.headers);
        optionHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific error response format for frontend
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Handle different error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('API request timed out for %s after %dms', url, this.timeout);
          throw new Error('Request timeout');
        }

        // Check for network errors and retry
        const isNetworkError =
          error.message.includes('Failed to fetch') ||
          error.message.includes('Network error') ||
          error.message === 'Network request failed' ||
          error.name === 'TypeError'; // TypeError often indicates network issues

        if (isNetworkError && retryCount < this.maxRetries - 1) {
          console.warn(
            'Network error for %s - retrying in %dms (attempt %d/%d)',
            url,
            this.retryDelay,
            retryCount + 1,
            this.maxRetries
          );
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this.requestWithRetry<T>(endpoint, options, retryCount + 1);
        }
      }
      console.error('API request failed for %s:', url, error);
      throw error;
    }
  }
}

// Export for testing
export { getBaseUrl };

export const frontendApiClient = new FrontendApiClient();
export default frontendApiClient;
