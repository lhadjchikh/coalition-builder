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

class FrontendApiClient extends BaseApiClient {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    super({ baseURL: getBaseUrl() });
  }

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options);
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

      const response = await fetch(url, {
        headers: this.defaultHeaders,
        credentials: 'same-origin',
        signal: controller.signal,
        ...options,
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
          throw new Error(`Request timed out after ${this.timeout}ms`);
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          // Retry on network errors if we haven't exceeded max retries
          if (retryCount < this.maxRetries) {
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
          console.error('Network error for %s - possible CORS issue or server not responding', url);
          throw new Error('Network error - please check if the server is running');
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
