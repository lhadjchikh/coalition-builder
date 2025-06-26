// Adapter to use the frontend API client in SSR context
// This allows us to reuse the same API logic while adapting it for server-side rendering

import { Campaign, HomePage } from "@frontend/types";

// SSR-compatible API client that mimics the frontend API
class SSRApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache settings for SSR
        next: {
          revalidate: 300, // Revalidate every 5 minutes
        },
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

  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>("/api/campaigns/");
  }

  async getHomepage(): Promise<HomePage> {
    return this.request<HomePage>("/api/homepage/");
  }
}

export const ssrApiClient = new SSRApiClient();
export default ssrApiClient;
