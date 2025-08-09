// SSR API client using shared base client
// This ensures consistency with frontend API while adding SSR-specific features

import { BaseApiClient } from "../services/api-client";

// SSR-compatible API client that extends the shared base client
class SSRApiClient extends BaseApiClient {
  constructor() {
    const baseURL =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    super({ baseURL });
  }

  protected async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: this.defaultHeaders,
        // Add cache settings for SSR
        next: {
          revalidate: 300, // Revalidate every 5 minutes
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }
}

export const ssrApiClient = new SSRApiClient();
export const apiClient = ssrApiClient; // For backwards compatibility
export default ssrApiClient;
