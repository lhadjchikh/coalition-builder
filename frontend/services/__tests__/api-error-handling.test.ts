import API from "../api";
import { withSuppressedErrors } from "@/tests/utils/testUtils";
import {
  createMockResponse,
  getExpectedUrl,
  createCleanEnv,
} from "./api-test-helpers";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("API Service - Error Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.replaceProperty(process, "env", createCleanEnv(originalEnv));
    delete (global as any).window;
  });

  afterAll(() => {
    jest.replaceProperty(process, "env", originalEnv);
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed JSON responses", async () => {
      await withSuppressedErrors(["Invalid JSON"], async () => {
        const mockResponse = {
          ok: true,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "application/json" : null,
          },
          json: async () => {
            throw new Error("Invalid JSON");
          },
        };

        // Mock all 3 retry attempts
        mockFetch
          .mockResolvedValueOnce(mockResponse)
          .mockResolvedValueOnce(mockResponse)
          .mockResolvedValueOnce(mockResponse);

        await expect(API.getCampaigns()).rejects.toThrow("Invalid JSON");
      });
    });

    it("should handle fetch rejections", async () => {
      await withSuppressedErrors(["Fetch failed"], async () => {
        mockFetch
          .mockRejectedValueOnce(new Error("Fetch failed"))
          .mockRejectedValueOnce(new Error("Fetch failed"))
          .mockRejectedValueOnce(new Error("Fetch failed"));

        await expect(API.getCampaigns()).rejects.toThrow("Fetch failed");
      });
    });

    it("should handle empty responses", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null));

      const campaigns = await API.getCampaigns();
      expect(campaigns).toBeNull();
    });

    it("should handle non-JSON error responses", async () => {
      await withSuppressedErrors(["HTTP error! status: 400"], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: {
            get: (name: string) =>
              name === "content-type" ? "text/html" : null,
          },
        });

        await expect(API.getCampaigns()).rejects.toThrow(
          "HTTP error! status: 400"
        );
      });
    });
  });

  describe("Retry logic", () => {
    it("should retry on network error and succeed on second attempt", async () => {
      const mockCampaigns = [
        {
          id: 1,
          name: "test-campaign",
          title: "Test Campaign",
          summary: "Test summary",
          active: true,
          created_at: "2023-01-01T00:00:00Z",
        },
      ];

      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(createMockResponse(mockCampaigns));

      const campaigns = await API.getCampaigns();
      expect(campaigns).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry up to 3 times before failing", async () => {
      await withSuppressedErrors(["Network error"], async () => {
        mockFetch
          .mockRejectedValueOnce(new Error("Network error"))
          .mockRejectedValueOnce(new Error("Network error"))
          .mockRejectedValueOnce(new Error("Network error"));

        await expect(API.getCampaigns()).rejects.toThrow("Network error");
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it("should not retry on non-network errors", async () => {
      await withSuppressedErrors(["HTTP error! status: 400"], async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({}, { ok: false, status: 400 })
        );

        await expect(API.getCampaigns()).rejects.toThrow(
          "HTTP error! status: 400"
        );
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Console logging", () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("should log errors when requests fail", async () => {
      const error = new Error("Network error");
      mockFetch
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      await expect(API.getCampaigns()).rejects.toThrow("Network error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "API request failed for %s:",
        getExpectedUrl("/api/campaigns/", originalEnv),
        error
      );
    });
  });
});
