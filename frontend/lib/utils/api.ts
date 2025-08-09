/**
 * Utility functions for API operations in SSR context
 */

/**
 * Fetches an API resource with JSON parsing and consistent error handling.
 *
 * @template T - The expected type of the API response
 * @param url - The URL to fetch from
 * @param options - Fetch options (headers, cache settings, etc.)
 * @param resourceName - Human-readable name of the resource for error messages
 * @returns Promise resolving to the parsed JSON response
 * @throws Error with descriptive message if fetch fails or JSON parsing fails
 */
export async function fetchApiResource<T>(
  url: string,
  options: RequestInit,
  resourceName: string,
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resourceName}: HTTP ${response.status}`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Failed to parse JSON for ${resourceName}`);
  }
}
