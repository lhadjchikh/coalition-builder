// Frontend API client implementation
// Extends the shared base client with browser-specific functionality like CSRF

import { BaseApiClient } from "./api-client";
import type { Endorsement, EndorsementCreate } from "../types";

export function getBaseUrl(): string {
  // Check environment variables in order of precedence
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In CI environments, default to localhost
  if (process.env.CI === "true") {
    return "http://localhost:8000";
  }

  // For browser context, always use relative URLs
  if (typeof window !== "undefined") {
    // Browser environment - use relative URLs to avoid CORS
    return "";
  }

  // SSR environment in production - use internal API URL or relative
  if (process.env.NODE_ENV === "production") {
    // Use API_URL for SSR fetches, or empty string for relative URLs
    return process.env.API_URL || "";
  }

  // Development SSR - fallback to localhost
  return "http://localhost:8000";
}

// Frontend API client with CSRF support
class FrontendApiClient extends BaseApiClient {
  private csrfToken: string | null = null;
  private csrfTokenPromise: Promise<string> | null = null;

  constructor() {
    super({
      baseURL: "", // Don't set a fixed base URL
      timeout: 30000,
    });
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get the base URL dynamically each time to ensure correct URL
    const baseUrl = getBaseUrl();
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

    let attempts = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const makeRequest = async (): Promise<T> => {
      const startTime = Date.now();

      // Set up abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      let response: Response;

      try {
        response = await fetch(url, {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...(options.headers instanceof Headers
              ? Object.fromEntries(options.headers.entries())
              : options.headers || {}),
          },
          signal: controller.signal,
          credentials: "same-origin",
        });
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout separately
        if (error instanceof Error && error.name === "AbortError") {
          const duration = Date.now() - startTime;
          console.error(
            "API request timed out for %s after %dms",
            url,
            duration
          );
          throw new Error("Request timeout");
        }

        // Re-throw the original error (network failure, etc.)
        throw error;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        return await response.json();
      } catch (error) {
        // Handle JSON parsing errors
        throw error;
      }
    };

    // Retry logic for network errors (but not HTTP errors)
    while (attempts < maxRetries) {
      try {
        return await makeRequest();
      } catch (error) {
        attempts++;

        // Don't retry HTTP errors (4xx, 5xx responses)
        if (error instanceof Error && error.message.startsWith("HTTP error!")) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempts >= maxRetries) {
          console.error("API request failed for %s:", url, error);
          throw error;
        }

        // Log retry attempt
        console.warn(
          "Network error for %s - retrying in %dms (attempt %d/%d)",
          url,
          retryDelay,
          attempts,
          maxRetries
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error("Unexpected retry loop exit");
  }

  private async getCsrfToken(): Promise<string> {
    // Only fetch CSRF token in browser environment
    if (typeof window === "undefined") {
      return "";
    }

    // First try to get token from cookie
    const cookieToken = this.getCsrfTokenFromCookie();
    if (cookieToken) {
      return cookieToken;
    }

    // If we already have a token, return it
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // If we're already fetching a token, wait for that promise
    if (this.csrfTokenPromise) {
      return this.csrfTokenPromise;
    }

    // Start fetching the token
    this.csrfTokenPromise = this.fetchCsrfToken();

    try {
      this.csrfToken = await this.csrfTokenPromise;
      return this.csrfToken;
    } finally {
      // Clear the promise so future calls can try again if needed
      this.csrfTokenPromise = null;
    }
  }

  private async fetchCsrfToken(): Promise<string> {
    try {
      // First try to get token from cookie
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === "csrftoken") {
            return value;
          }
        }
      }

      // If no cookie, fetch from API
      const response = await fetch(`${this.baseURL}/api/csrf-token/`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      return data.csrf_token;
    } catch (error) {
      console.warn("Failed to fetch CSRF token:", error);
      return "";
    }
  }

  // Enhanced POST method with CSRF support
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const csrfToken = await this.getCsrfToken();

    const headers = new Headers(this.defaultHeaders);
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }

    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Enhanced PUT method with CSRF support
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const csrfToken = await this.getCsrfToken();

    const headers = new Headers(this.defaultHeaders);
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }

    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Enhanced DELETE method with CSRF support
  async delete<T>(endpoint: string): Promise<T> {
    const csrfToken = await this.getCsrfToken();

    const headers = new Headers(this.defaultHeaders);
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }

    return this.request<T>(endpoint, {
      method: "DELETE",
      headers,
    });
  }

  // Basic GET method (no CSRF needed)
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
    });
  }

  // Enhanced PATCH method with CSRF support
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    // Get CSRF token from cookie
    const csrfToken = this.getCsrfTokenFromCookie();

    const headers = new Headers(this.defaultHeaders);
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }

    return this.request<T>(endpoint, {
      method: "PATCH",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Get CSRF token from cookie
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === "undefined") {
      return null;
    }

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "csrftoken") {
        return value;
      }
    }
    return null;
  }

  // Override createEndorsement to use CSRF-enabled POST
  async createEndorsement(
    endorsementData: EndorsementCreate
  ): Promise<Endorsement> {
    return this.post<Endorsement>("/api/endorsements/", endorsementData);
  }
}

export const frontendApiClient = new FrontendApiClient();
export default frontendApiClient;
