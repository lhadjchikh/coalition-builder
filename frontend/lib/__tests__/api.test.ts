import { apiClient } from "../api";
import type { Campaign } from "../../types";
import { withSuppressedErrors } from "@/tests/utils/testUtils";

// Mock fetch globally
global.fetch = jest.fn();

describe("ApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCampaignByName", () => {
    const mockCampaigns: Campaign[] = [
      {
        id: 1,
        name: "test-campaign",
        title: "Test Campaign",
        summary: "Test campaign summary",
        active: true,
        created_at: "2024-01-01",
      },
      {
        id: 2,
        name: "another-campaign",
        title: "Another Campaign",
        summary: "Another campaign summary",
        active: true,
        created_at: "2024-01-02",
      },
    ];

    it("should return campaign data when campaign is found", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async (): Promise<Campaign> => mockCampaigns[0],
      });

      const result = await apiClient.getCampaignByName("test-campaign");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/by-name/test-campaign/",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockCampaigns[0]);
    });

    it("should handle URL encoding for campaign names with special characters", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async (): Promise<Campaign[]> => [mockCampaigns[0]],
      });

      await apiClient.getCampaignByName("test campaign with spaces");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/by-name/test%20campaign%20with%20spaces/",
        expect.any(Object)
      );
    });

    it("should handle 404 errors when campaign is not found", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        apiClient.getCampaignByName("non-existent-campaign")
      ).rejects.toThrow("HTTP error! status: 404");
    });

    it("should handle HTTP errors from the API", async () => {
      await withSuppressedErrors(["HTTP error! status: 500"], async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(
          apiClient.getCampaignByName("test-campaign")
        ).rejects.toThrow("HTTP error! status: 500");
      });
    });

    it("should handle network errors", async () => {
      await withSuppressedErrors(["Network error"], async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

        await expect(
          apiClient.getCampaignByName("test-campaign")
        ).rejects.toThrow("Network error");
      });
    });

    it("should return campaign data directly from API", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async (): Promise<Campaign> => mockCampaigns[0],
      });

      const result = await apiClient.getCampaignByName("test-campaign");

      expect(result).toEqual(mockCampaigns[0]);
    });

    it("should handle empty campaign name", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(apiClient.getCampaignByName("")).rejects.toThrow(
        "HTTP error! status: 404"
      );

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/by-name//",
        expect.any(Object)
      );
    });
  });
});
