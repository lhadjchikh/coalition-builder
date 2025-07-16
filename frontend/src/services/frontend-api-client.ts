/**
 * Frontend API client that extends the shared base client
 * Handles frontend-specific URL resolution and error handling
 */

import { BaseApiClient } from '@shared/services/api-client';

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
  constructor() {
    super({ baseURL: getBaseUrl() });
  }

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: this.defaultHeaders,
        ...options,
      });

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
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  // Export getBaseUrl for testing
  getBaseUrl = getBaseUrl;
}

export const frontendApiClient = new FrontendApiClient();
export default frontendApiClient;
