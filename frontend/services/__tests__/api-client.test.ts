import { BaseApiClient } from "../api-client";
import {
  Campaign,
  Endorser,
  Legislator,
  Endorsement,
  HomePage,
  ContentBlock,
  LegalDocumentResponse,
  EndorsementCreate,
} from "../../types";

// Create a concrete implementation for testing
class TestApiClient extends BaseApiClient {
  public requestMock = jest.fn();

  protected async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    return this.requestMock(endpoint, options);
  }
}

describe("BaseApiClient", () => {
  let client: TestApiClient;

  beforeEach(() => {
    client = new TestApiClient({
      baseURL: "https://api.example.com",
      timeout: 5000,
      headers: { "X-Custom": "test" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      expect(client["baseURL"]).toBe("https://api.example.com");
      expect(client["timeout"]).toBe(5000);
      expect(client["defaultHeaders"]).toEqual({
        "Content-Type": "application/json",
        "X-Custom": "test",
      });
    });

    it("should use default timeout if not provided", () => {
      const clientWithoutTimeout = new TestApiClient({
        baseURL: "https://api.example.com",
      });
      expect(clientWithoutTimeout["timeout"]).toBe(10000);
    });
  });

  describe("getCampaigns", () => {
    it("should fetch campaigns", async () => {
      const mockCampaigns: Campaign[] = [
        { id: 1, name: "Campaign 1" } as Campaign,
      ];
      client.requestMock.mockResolvedValue(mockCampaigns);

      const result = await client.getCampaigns();

      expect(result).toEqual(mockCampaigns);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/campaigns/",
        undefined,
      );
    });
  });

  describe("getCampaignById", () => {
    it("should fetch campaign by ID", async () => {
      const mockCampaign: Campaign = { id: 1, name: "Campaign 1" } as Campaign;
      client.requestMock.mockResolvedValue(mockCampaign);

      const result = await client.getCampaignById(1);

      expect(result).toEqual(mockCampaign);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/campaigns/1/",
        undefined,
      );
    });
  });

  describe("getCampaignByName", () => {
    it("should fetch campaign by name", async () => {
      const mockCampaign: Campaign = {
        id: 1,
        name: "test-campaign",
      } as Campaign;
      client.requestMock.mockResolvedValue(mockCampaign);

      const result = await client.getCampaignByName("test-campaign");

      expect(result).toEqual(mockCampaign);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/campaigns/by-name/test-campaign/",
        undefined,
      );
    });

    it("should encode special characters in name", async () => {
      const mockCampaign: Campaign = {
        id: 1,
        name: "test campaign",
      } as Campaign;
      client.requestMock.mockResolvedValue(mockCampaign);

      const result = await client.getCampaignByName("test campaign");

      expect(result).toEqual(mockCampaign);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/campaigns/by-name/test%20campaign/",
        undefined,
      );
    });
  });

  describe("getCampaign", () => {
    it("should fetch campaign", async () => {
      const mockCampaign: Campaign = { id: 2, name: "Campaign 2" } as Campaign;
      client.requestMock.mockResolvedValue(mockCampaign);

      const result = await client.getCampaign(2);

      expect(result).toEqual(mockCampaign);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/campaigns/2/",
        undefined,
      );
    });
  });

  describe("getEndorsers", () => {
    it("should fetch endorsers", async () => {
      const mockEndorsers: Endorser[] = [
        { id: 1, first_name: "John" } as Endorser,
      ];
      client.requestMock.mockResolvedValue(mockEndorsers);

      const result = await client.getEndorsers();

      expect(result).toEqual(mockEndorsers);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/endorsers/",
        undefined,
      );
    });
  });

  describe("getLegislators", () => {
    it("should fetch legislators", async () => {
      const mockLegislators: Legislator[] = [
        { id: 1, first_name: "Jane" } as Legislator,
      ];
      client.requestMock.mockResolvedValue(mockLegislators);

      const result = await client.getLegislators();

      expect(result).toEqual(mockLegislators);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/legislators/",
        undefined,
      );
    });
  });

  describe("getEndorsements", () => {
    it("should fetch endorsements", async () => {
      const mockEndorsements: Endorsement[] = [
        { id: 1, statement: "Support" } as Endorsement,
      ];
      client.requestMock.mockResolvedValue(mockEndorsements);

      const result = await client.getEndorsements();

      expect(result).toEqual(mockEndorsements);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/endorsements/",
        undefined,
      );
    });
  });

  describe("getCampaignEndorsements", () => {
    it("should fetch campaign endorsements", async () => {
      const mockEndorsements: Endorsement[] = [
        { id: 1, statement: "Support" } as Endorsement,
      ];
      client.requestMock.mockResolvedValue(mockEndorsements);

      const result = await client.getCampaignEndorsements(1);

      expect(result).toEqual(mockEndorsements);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/endorsements/?campaign_id=1",
        undefined,
      );
    });
  });

  describe("createEndorsement", () => {
    it("should create endorsement", async () => {
      const endorsementData: EndorsementCreate = {
        campaign_id: 1,
        stakeholder: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          street_address: "123 Main St",
          city: "City",
          state: "ST",
          zip_code: "12345",
          type: "individual",
        },
        statement: "I support",
        public_display: true,
        terms_accepted: true,
        org_authorized: false,
      };

      const mockEndorsement: Endorsement = {
        id: 1,
        ...endorsementData,
      } as any;

      client.requestMock.mockResolvedValue(mockEndorsement);

      const result = await client.createEndorsement(endorsementData);

      expect(result).toEqual(mockEndorsement);
      expect(client.requestMock).toHaveBeenCalledWith("/api/endorsements/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(endorsementData),
      });
    });
  });

  describe("getHomepage", () => {
    it("should fetch homepage", async () => {
      const mockHomepage: HomePage = {
        id: 1,
        organization_name: "Test Org",
      } as HomePage;
      client.requestMock.mockResolvedValue(mockHomepage);

      const result = await client.getHomepage();

      expect(result).toEqual(mockHomepage);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/homepage/",
        undefined,
      );
    });
  });

  describe("getHomepageById", () => {
    it("should fetch homepage by ID", async () => {
      const mockHomepage: HomePage = {
        id: 2,
        organization_name: "Test Org",
      } as HomePage;
      client.requestMock.mockResolvedValue(mockHomepage);

      const result = await client.getHomepageById(2);

      expect(result).toEqual(mockHomepage);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/homepage/2/",
        undefined,
      );
    });
  });

  describe("getContentBlocks", () => {
    it("should fetch content blocks", async () => {
      const mockBlocks: ContentBlock[] = [
        { id: 1, title: "Block 1" } as ContentBlock,
      ];
      client.requestMock.mockResolvedValue(mockBlocks);

      const result = await client.getContentBlocks();

      expect(result).toEqual(mockBlocks);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/content-blocks/",
        undefined,
      );
    });
  });

  describe("getContentBlocksByPageType", () => {
    it("should fetch content blocks by page type", async () => {
      const mockBlocks: ContentBlock[] = [
        { id: 1, title: "Block 1" } as ContentBlock,
      ];
      client.requestMock.mockResolvedValue(mockBlocks);

      const result = await client.getContentBlocksByPageType("homepage");

      expect(result).toEqual(mockBlocks);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/content-blocks/?page_type=homepage",
        undefined,
      );
    });
  });

  describe("getTermsOfUse", () => {
    it("should fetch terms of use", async () => {
      const mockDoc: LegalDocumentResponse = {
        title: "Terms",
        content: "Legal content",
        last_updated: "2024-01-01",
      };
      client.requestMock.mockResolvedValue(mockDoc);

      const result = await client.getTermsOfUse();

      expect(result).toEqual(mockDoc);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/legal/terms/",
        undefined,
      );
    });
  });

  describe("getPrivacyPolicy", () => {
    it("should fetch privacy policy", async () => {
      const mockDoc: LegalDocumentResponse = {
        title: "Privacy Policy",
        content: "Privacy content",
        last_updated: "2024-01-01",
      };
      client.requestMock.mockResolvedValue(mockDoc);

      const result = await client.getPrivacyPolicy();

      expect(result).toEqual(mockDoc);
      expect(client.requestMock).toHaveBeenCalledWith(
        "/api/legal/privacy/",
        undefined,
      );
    });
  });
});
