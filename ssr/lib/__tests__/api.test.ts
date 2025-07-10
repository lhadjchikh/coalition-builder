import { apiClient } from "../api";
import type { Campaign } from "@frontend/types";

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

    it("should return the first campaign when multiple campaigns match", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      });

      const result = await apiClient.getCampaignByName("test-campaign");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/?name=test-campaign",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(result).toEqual(mockCampaigns[0]);
    });

    it("should handle URL encoding for campaign names with special characters", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCampaigns[0]],
      });

      await apiClient.getCampaignByName("test campaign with spaces");

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/?name=test%20campaign%20with%20spaces",
        expect.any(Object),
      );
    });

    it("should throw error when no campaigns are found", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await expect(
        apiClient.getCampaignByName("non-existent-campaign"),
      ).rejects.toThrow("No campaign found with name: non-existent-campaign");
    });

    it("should handle HTTP errors from the API", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        apiClient.getCampaignByName("test-campaign"),
      ).rejects.toThrow("HTTP error! status: 500");
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      await expect(
        apiClient.getCampaignByName("test-campaign"),
      ).rejects.toThrow("Network error");
    });

    it("should return single campaign when array has one item", async () => {
      const singleCampaign = [mockCampaigns[0]];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => singleCampaign,
      });

      const result = await apiClient.getCampaignByName("test-campaign");

      expect(result).toEqual(mockCampaigns[0]);
    });

    it("should handle empty campaign name", async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await expect(apiClient.getCampaignByName("")).rejects.toThrow(
        "No campaign found with name: ",
      );

      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/campaigns/?name=",
        expect.any(Object),
      );
    });
  });
});
