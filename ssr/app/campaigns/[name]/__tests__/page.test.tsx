import React from "react";
import { render } from "@testing-library/react";
import { notFound } from "next/navigation";
import CampaignPage, { generateStaticParams, generateMetadata } from "../page";
import { apiClient } from "../../../../lib/api";

// Mock dependencies
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("../../../../lib/api", () => ({
  apiClient: {
    getCampaigns: jest.fn(),
    getCampaignByName: jest.fn(),
  },
}));

jest.mock("../CampaignDetailWrapper", () => {
  return function MockCampaignDetailWrapper({
    campaignId,
  }: {
    campaignId: number;
  }) {
    return (
      <div data-testid="campaign-detail-wrapper">Campaign ID: {campaignId}</div>
    );
  };
});

describe("CampaignPage", () => {
  const mockCampaigns = [
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

  // Global beforeEach for all tests
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe("CampaignPage component", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
      (notFound as jest.Mock).mockImplementation(() => {
        throw new Error("notFound called");
      });
    });

    it("should render campaign detail when campaign is found", async () => {
      (apiClient.getCampaignByName as jest.Mock).mockResolvedValue(
        mockCampaigns[0],
      );
      (notFound as jest.Mock).mockImplementation(() => {}); // Override for this test

      const { container } = render(
        await CampaignPage({
          params: Promise.resolve({ name: "test-campaign" }),
        }),
      );

      expect(apiClient.getCampaignByName).toHaveBeenCalledWith("test-campaign");
      expect(apiClient.getCampaignByName).toHaveBeenCalledTimes(1);
      expect(notFound).not.toHaveBeenCalled();

      const wrapper = container.querySelector(
        '[data-testid="campaign-detail-wrapper"]',
      );
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent).toBe("Campaign ID: 1");
    });

    it("should call notFound when campaign is not found", async () => {
      (apiClient.getCampaignByName as jest.Mock).mockRejectedValue(
        new Error("Campaign not found"),
      );

      await expect(async () => {
        await CampaignPage({
          params: Promise.resolve({ name: "non-existent-campaign" }),
        });
      }).rejects.toThrow("notFound called");

      expect(apiClient.getCampaignByName).toHaveBeenCalledWith(
        "non-existent-campaign",
      );
      expect(apiClient.getCampaignByName).toHaveBeenCalledTimes(1);
      expect(notFound).toHaveBeenCalled();
    });

    it("should call notFound when API throws error", async () => {
      (apiClient.getCampaignByName as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      await expect(async () => {
        await CampaignPage({
          params: Promise.resolve({ name: "test-campaign" }),
        });
      }).rejects.toThrow("notFound called");

      expect(apiClient.getCampaignByName).toHaveBeenCalledWith("test-campaign");
      expect(apiClient.getCampaignByName).toHaveBeenCalledTimes(1);
      expect(notFound).toHaveBeenCalled();
    });
  });

  // These test suites now have proper mock isolation
  describe("generateStaticParams", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it("should return campaign names as params", async () => {
      (apiClient.getCampaigns as jest.Mock).mockResolvedValue([
        ...mockCampaigns,
      ]);

      const params = await generateStaticParams();

      expect(params).toEqual([
        { name: "test-campaign" },
        { name: "another-campaign" },
      ]);
      expect(apiClient.getCampaigns).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when API throws error", async () => {
      (apiClient.getCampaigns as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      expect(apiClient.getCampaigns).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateMetadata", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it("should return campaign metadata when found", async () => {
      (apiClient.getCampaigns as jest.Mock).mockResolvedValue([
        ...mockCampaigns,
      ]);

      const metadata = await generateMetadata({
        params: Promise.resolve({ name: "test-campaign" }),
      });

      expect(metadata).toEqual({
        title: "Test Campaign",
        description: "Test campaign summary",
      });
      expect(apiClient.getCampaigns).toHaveBeenCalledTimes(1);
    });

    it("should return not found metadata when campaign not found", async () => {
      (apiClient.getCampaigns as jest.Mock).mockResolvedValue([
        ...mockCampaigns,
      ]);

      const metadata = await generateMetadata({
        params: Promise.resolve({ name: "non-existent-campaign" }),
      });

      expect(metadata).toEqual({
        title: "Campaign Not Found",
      });
      expect(apiClient.getCampaigns).toHaveBeenCalledTimes(1);
    });

    it("should return default metadata on error", async () => {
      (apiClient.getCampaigns as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      const metadata = await generateMetadata({
        params: Promise.resolve({ name: "test-campaign" }),
      });

      expect(metadata).toEqual({
        title: "Campaign",
      });
      expect(apiClient.getCampaigns).toHaveBeenCalledTimes(1);
    });
  });
});
