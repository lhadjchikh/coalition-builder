/**
 * Shared test helpers for API service tests
 */

// Helper to match Headers objects in tests
export const expectHeaders = (headers: any): boolean => {
  // Check if headers has the correct Content-Type
  // In tests, headers might be a plain object, not a Headers instance
  if (headers instanceof Headers) {
    expect(headers.get("Content-Type")).toBe("application/json");
  } else if (headers && typeof headers === "object") {
    expect(headers["Content-Type"]).toBe("application/json");
  }
  return true;
};

// Helper to create mock response with headers
export const createMockResponse = (
  body: any,
  options: { ok?: boolean; status?: number; contentType?: string } = {}
) => {
  const { ok = true, status = 200, contentType = "application/json" } = options;
  return {
    ok,
    status,
    headers: {
      get: (name: string) => (name === "content-type" ? contentType : null),
    },
    json: async () => body,
  };
};

// Helper to get expected URL based on environment
export const getExpectedUrl = (
  path: string,
  originalEnv: NodeJS.ProcessEnv
): string => {
  // Check if window is defined (browser/jsdom environment)
  if (typeof window !== "undefined") {
    // Browser environment uses relative URLs
    return path;
  }
  // SSR/Node environment uses full URLs
  return `http://localhost:8000${path}`;
};

// Helper to create clean environment without CI variables affecting tests
export const createCleanEnv = (
  originalEnv: NodeJS.ProcessEnv,
  overrides: Record<string, string | undefined> = {}
): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(
    Object.entries(originalEnv).filter(
      ([key]) =>
        !["CI", "NEXT_PUBLIC_API_URL", "REACT_APP_API_URL"].includes(key)
    )
  ),
  // Ensure required properties are present for NodeJS.ProcessEnv
  NODE_ENV: originalEnv.NODE_ENV || "test",
  PUBLIC_URL: originalEnv.PUBLIC_URL || "",
  PATH: originalEnv.PATH || "",
  HOME: originalEnv.HOME || "",
  ...overrides,
});

// Common mock data
export const mockCampaign = {
  id: 1,
  name: "Test Campaign",
  slug: "test-campaign",
  description: "Test description",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

export const mockEndorser = {
  id: 1,
  name: "Test Endorser",
  organization: "Test Org",
  title: "Test Title",
};

export const mockLegislator = {
  id: 1,
  name: "Test Legislator",
  district: "Test District",
  party: "Test Party",
};

export const mockEndorsement = {
  id: 1,
  campaign_id: 1,
  endorser_id: 1,
  created_at: "2023-01-01T00:00:00Z",
};

export const mockHomepage = {
  title: "Test Homepage",
  content: "Test content",
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
};
