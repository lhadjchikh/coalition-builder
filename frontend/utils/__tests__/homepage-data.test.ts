import {
  getFallbackHomepage,
  getApiUrl,
  fetchHomepage,
  fetchCampaigns,
} from "../homepage-data";
import { HomePage, Campaign } from "../../types";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Date for consistent testing
const mockDate = new Date("2024-01-01T00:00:00.000Z");
jest.spyOn(global, "Date").mockImplementation(() => mockDate);

describe("homepage-data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_ORGANIZATION_NAME;
    delete process.env.ORGANIZATION_NAME;
    delete process.env.NEXT_PUBLIC_TAGLINE;
    delete process.env.TAGLINE;
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.REACT_APP_API_URL;
  });

  describe("getFallbackHomepage", () => {
    it("should return fallback homepage with default values", () => {
      const fallback = getFallbackHomepage();

      expect(fallback).toEqual({
        id: 0,
        organization_name: "Coalition Builder",
        tagline: "Building strong advocacy partnerships",
        hero_title: "Welcome to Coalition Builder",
        hero_subtitle: "Empowering advocates to build strong policy coalitions",
        hero_background_image_url: "",
        hero_overlay_enabled: true,
        hero_overlay_color: "#000000",
        hero_overlay_opacity: 0.4,
        cta_title: "Get Involved",
        cta_content: "Join our coalition and help make a difference.",
        cta_button_text: "Learn More",
        cta_button_url: "",
        facebook_url: "",
        twitter_url: "",
        instagram_url: "",
        linkedin_url: "",
        campaigns_section_title: "Policy Campaigns",
        campaigns_section_subtitle: "",
        show_campaigns_section: true,
        is_active: true,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should use NEXT_PUBLIC_ORGANIZATION_NAME when available", () => {
      process.env.NEXT_PUBLIC_ORGANIZATION_NAME = "Test Org";

      const fallback = getFallbackHomepage();

      expect(fallback.organization_name).toBe("Test Org");
    });

    it("should use ORGANIZATION_NAME as fallback", () => {
      process.env.ORGANIZATION_NAME = "Fallback Org";

      const fallback = getFallbackHomepage();

      expect(fallback.organization_name).toBe("Fallback Org");
    });

    it("should prioritize NEXT_PUBLIC_ORGANIZATION_NAME over ORGANIZATION_NAME", () => {
      process.env.NEXT_PUBLIC_ORGANIZATION_NAME = "Primary Org";
      process.env.ORGANIZATION_NAME = "Fallback Org";

      const fallback = getFallbackHomepage();

      expect(fallback.organization_name).toBe("Primary Org");
    });

    it("should use NEXT_PUBLIC_TAGLINE when available", () => {
      process.env.NEXT_PUBLIC_TAGLINE = "Test Tagline";

      const fallback = getFallbackHomepage();

      expect(fallback.tagline).toBe("Test Tagline");
    });

    it("should use TAGLINE as fallback", () => {
      process.env.TAGLINE = "Fallback Tagline";

      const fallback = getFallbackHomepage();

      expect(fallback.tagline).toBe("Fallback Tagline");
    });

    it("should prioritize NEXT_PUBLIC_TAGLINE over TAGLINE", () => {
      process.env.NEXT_PUBLIC_TAGLINE = "Primary Tagline";
      process.env.TAGLINE = "Fallback Tagline";

      const fallback = getFallbackHomepage();

      expect(fallback.tagline).toBe("Primary Tagline");
    });
  });

  describe("getApiUrl", () => {
    describe("in SSR environment (window undefined)", () => {
      const originalWindow = global.window;

      beforeEach(() => {
        delete (global as any).window;
      });

      afterEach(() => {
        global.window = originalWindow;
      });

      it("should return default URL when no env vars set", () => {
        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://localhost:8000");
      });

      it("should use API_URL when available", () => {
        process.env.API_URL = "http://server.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://server.example.com");
      });

      it("should use NEXT_PUBLIC_API_URL as fallback", () => {
        process.env.NEXT_PUBLIC_API_URL = "http://public.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://public.example.com");
      });

      it("should prioritize API_URL over NEXT_PUBLIC_API_URL", () => {
        process.env.API_URL = "http://server.example.com";
        process.env.NEXT_PUBLIC_API_URL = "http://public.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://server.example.com");
      });
    });

    describe("in client environment (window defined)", () => {
      beforeEach(() => {
        // Ensure window is defined
        global.window = {} as any;
      });

      it("should return default URL when no env vars set", () => {
        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://localhost:8000");
      });

      it("should use NEXT_PUBLIC_API_URL when available", () => {
        process.env.NEXT_PUBLIC_API_URL = "http://public.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://public.example.com");
      });

      it("should use REACT_APP_API_URL as fallback", () => {
        process.env.REACT_APP_API_URL = "http://react.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://react.example.com");
      });

      it("should prioritize NEXT_PUBLIC_API_URL over REACT_APP_API_URL", () => {
        process.env.NEXT_PUBLIC_API_URL = "http://public.example.com";
        process.env.REACT_APP_API_URL = "http://react.example.com";

        const apiUrl = getApiUrl();
        expect(apiUrl).toBe("http://public.example.com");
      });
    });
  });

  describe("fetchHomepage", () => {
    const mockHomepage: HomePage = {
      id: 1,
      organization_name: "Test Organization",
      tagline: "Test Tagline",
      hero_title: "Hero Title",
      hero_subtitle: "Hero Subtitle",
      hero_background_image_url: "https://example.com/hero.jpg",
      hero_overlay_enabled: true,
      hero_overlay_color: "#000000",
      hero_overlay_opacity: 0.5,
      cta_title: "CTA Title",
      cta_content: "CTA Content",
      cta_button_text: "Click Me",
      cta_button_url: "/action",
      facebook_url: "https://facebook.com/test",
      twitter_url: "https://twitter.com/test",
      instagram_url: "https://instagram.com/test",
      linkedin_url: "https://linkedin.com/test",
      campaigns_section_title: "Our Campaigns",
      campaigns_section_subtitle: "Check out our campaigns",
      show_campaigns_section: true,
      is_active: true,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    it("should fetch homepage successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHomepage,
      });

      const result = await fetchHomepage();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/homepage/",
        {
          next: { revalidate: 300 },
        }
      );
      expect(result).toEqual(mockHomepage);
    });

    it("should use correct API URL from environment", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHomepage,
      });

      await fetchHomepage();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/homepage/",
        {
          next: { revalidate: 300 },
        }
      );
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchHomepage()).rejects.toThrow(
        "Failed to fetch homepage: 404"
      );
    });

    it("should throw error when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchHomepage()).rejects.toThrow("Network error");
    });

    it("should handle server error status codes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchHomepage()).rejects.toThrow(
        "Failed to fetch homepage: 500"
      );
    });
  });

  describe("fetchCampaigns", () => {
    const mockCampaigns: Campaign[] = [
      {
        id: 1,
        name: "campaign-1",
        title: "Campaign 1",
        summary: "Campaign 1 summary",
        active: true,
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        name: "campaign-2",
        title: "Campaign 2",
        summary: "Campaign 2 summary",
        active: true,
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ];

    it("should fetch campaigns successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      });

      const result = await fetchCampaigns();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/",
        {
          next: { revalidate: 300 },
        }
      );
      expect(result).toEqual(mockCampaigns);
    });

    it("should use correct API URL from environment", async () => {
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      });

      await fetchCampaigns();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/campaigns/",
        {
          next: { revalidate: 300 },
        }
      );
    });

    it("should throw error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(fetchCampaigns()).rejects.toThrow(
        "Failed to fetch campaigns: 403"
      );
    });

    it("should throw error when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(fetchCampaigns()).rejects.toThrow("Connection refused");
    });

    it("should handle empty campaigns array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchCampaigns();

      expect(result).toEqual([]);
    });

    it("should handle server error status codes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(fetchCampaigns()).rejects.toThrow(
        "Failed to fetch campaigns: 503"
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle both SSR and client environments consistently", () => {
      // Test SSR environment
      const originalWindow = global.window;
      delete (global as any).window;

      process.env.API_URL = "http://ssr.example.com";
      process.env.NEXT_PUBLIC_API_URL = "http://client.example.com";

      const ssrUrl = getApiUrl();
      expect(ssrUrl).toBe("http://ssr.example.com");

      // Test client environment
      global.window = {} as any;
      const clientUrl = getApiUrl();
      expect(clientUrl).toBe("http://client.example.com");

      global.window = originalWindow;
    });

    it("should work with fallback data when API fails", () => {
      const fallback = getFallbackHomepage();

      expect(fallback.id).toBe(0);
      expect(fallback.organization_name).toBe("Coalition Builder");
      expect(fallback.is_active).toBe(true);
      expect(fallback.show_campaigns_section).toBe(true);
    });
  });
});
