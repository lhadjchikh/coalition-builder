import API from "../api";
import {
  Campaign,
  Endorser,
  Legislator,
  Endorsement,
  HomePage,
} from "../../types/index";
import {
  expectHeaders,
  createMockResponse,
  getExpectedUrl,
  createCleanEnv,
  mockCampaign,
  mockEndorser,
  mockLegislator,
  mockEndorsement,
  mockHomepage,
} from "./api-test-helpers";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("API Service - GET Methods", () => {
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

  describe("getCampaigns", () => {
    const mockCampaigns: Campaign[] = [
      mockCampaign as Campaign,
      { ...mockCampaign, id: 2, name: "Campaign 2" } as Campaign,
    ];

    it("should fetch campaigns successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaigns));

      const result = await API.getCampaigns();

      expect(result).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/campaigns/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 500 }),
      );

      await expect(API.getCampaigns()).rejects.toThrow("HTTP error! status: 500");
    });

    it("should handle network failures", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));

      await expect(API.getCampaigns()).rejects.toThrow("Network error");
    });

  });

  describe("getEndorsers", () => {
    const mockEndorsers: Endorser[] = [
      mockEndorser as Endorser,
      { ...mockEndorser, id: 2, name: "Endorser 2" } as Endorser,
    ];

    it("should fetch endorsers successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsers));

      const result = await API.getEndorsers();

      expect(result).toEqual(mockEndorsers);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/endorsers/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404 }),
      );

      await expect(API.getEndorsers()).rejects.toThrow("HTTP error! status: 404");
    });
  });

  describe("getLegislators", () => {
    const mockLegislators: Legislator[] = [
      mockLegislator as Legislator,
      { ...mockLegislator, id: 2, name: "Legislator 2" } as Legislator,
    ];

    it("should fetch legislators successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLegislators));

      const result = await API.getLegislators();

      expect(result).toEqual(mockLegislators);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/legislators/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 403 }),
      );

      await expect(API.getLegislators()).rejects.toThrow("HTTP error! status: 403");
    });
  });

  describe("getEndorsements", () => {
    const mockEndorsements: Endorsement[] = [
      mockEndorsement as Endorsement,
      { ...mockEndorsement, id: 2 } as Endorsement,
    ];

    it("should fetch endorsements successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      const result = await API.getEndorsements();

      expect(result).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/endorsements/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 500 }),
      );

      await expect(API.getEndorsements()).rejects.toThrow("HTTP error! status: 500");
    });
  });

  describe("getCampaignEndorsements", () => {
    const mockEndorsements: Endorsement[] = [
      mockEndorsement as Endorsement,
      { ...mockEndorsement, id: 2 } as Endorsement,
    ];

    it("should fetch campaign endorsements successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      const result = await API.getCampaignEndorsements(1);

      expect(result).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/endorsements/?campaign_id=1", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404 }),
      );

      await expect(API.getCampaignEndorsements(1)).rejects.toThrow(
        "HTTP error! status: 404",
      );
    });

    it("should use relative URL for production (default behavior)", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEndorsements));

      const result = await API.getCampaignEndorsements(1);

      expect(result).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^(http:\/\/localhost:8000)?\/api\/endorsements\//),
        expect.anything(),
      );
    });
  });

  describe("getCampaignById", () => {
    it("should fetch campaign by ID successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaign));

      const result = await API.getCampaignById(1);

      expect(result).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/campaigns/1/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404 }),
      );

      await expect(API.getCampaignById(1)).rejects.toThrow("HTTP error! status: 404");
    });
  });

  describe("getCampaignByName", () => {
    it("should fetch campaign by name successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCampaign));

      const result = await API.getCampaignByName("test-campaign");

      expect(result).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/campaigns/by-name/test-campaign/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404 }),
      );

      await expect(API.getCampaignByName("non-existent")).rejects.toThrow(
        "HTTP error! status: 404",
      );
    });
  });

  describe("getHomepage", () => {
    it("should fetch homepage successfully", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHomepage));

      const result = await API.getHomepage();

      expect(result).toEqual(mockHomepage);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/homepage/", originalEnv),
        expect.objectContaining({
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 500 }),
      );

      await expect(API.getHomepage()).rejects.toThrow("HTTP error! status: 500");
    });
  });
});