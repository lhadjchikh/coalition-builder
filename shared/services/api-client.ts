/**
 * Base API client with shared functionality
 * Can be extended by frontend and SSR implementations
 */

import type {
  Campaign,
  HomePage,
  ContentBlock,
  LegalDocumentResponse,
  Endorser,
  Legislator,
  Endorsement,
  EndorsementCreate,
} from "../types";

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export abstract class BaseApiClient {
  protected baseURL: string;
  protected timeout: number;
  protected defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  protected abstract request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T>;

  // Common API methods that both frontend and SSR need
  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>("/api/campaigns/");
  }

  async getCampaignById(id: number): Promise<Campaign> {
    return this.request<Campaign>(`/api/campaigns/${id}/`);
  }

  async getCampaignByName(name: string): Promise<Campaign> {
    return this.request<Campaign>(
      `/api/campaigns/by-name/${encodeURIComponent(name)}/`,
    );
  }

  async getCampaign(id: number): Promise<Campaign> {
    return this.request<Campaign>(`/api/campaigns/${id}/`);
  }

  async getEndorsers(): Promise<Endorser[]> {
    return this.request<Endorser[]>("/api/endorsers/");
  }

  async getLegislators(): Promise<Legislator[]> {
    return this.request<Legislator[]>("/api/legislators/");
  }

  async getEndorsements(): Promise<Endorsement[]> {
    return this.request<Endorsement[]>("/api/endorsements/");
  }

  async getCampaignEndorsements(campaignId: number): Promise<Endorsement[]> {
    return this.request<Endorsement[]>(
      `/api/endorsements/?campaign_id=${campaignId}`,
    );
  }

  async createEndorsement(
    endorsementData: EndorsementCreate,
  ): Promise<Endorsement> {
    return this.request<Endorsement>("/api/endorsements/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(endorsementData),
    });
  }

  async getHomepage(): Promise<HomePage> {
    return this.request<HomePage>("/api/homepage/");
  }

  async getHomepageById(id: number): Promise<HomePage> {
    return this.request<HomePage>(`/api/homepage/${id}/`);
  }

  async getContentBlocks(pageType?: string | number): Promise<ContentBlock[]> {
    let endpoint = "/api/content-blocks/";
    if (pageType !== undefined) {
      if (typeof pageType === "string") {
        endpoint = `/api/content-blocks/?page_type=${pageType}`;
      } else {
        endpoint = `/api/content-blocks/?homepage_id=${pageType}`;
      }
    }
    return this.request<ContentBlock[]>(endpoint);
  }

  async getContentBlock(blockId: number): Promise<ContentBlock> {
    return this.request<ContentBlock>(`/api/content-blocks/${blockId}/`);
  }

  async getTermsOfUse(): Promise<LegalDocumentResponse> {
    return this.request<LegalDocumentResponse>("/api/legal/terms/");
  }

  async getPrivacyPolicy(): Promise<LegalDocumentResponse> {
    return this.request<LegalDocumentResponse>("/api/legal/privacy/");
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/api/health/");
  }
}
