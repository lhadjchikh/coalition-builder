import { Campaign, Endorser, Legislator, Endorsement, EndorsementCreate, HomePage } from '../types';

// Determine the API base URL
const getBaseUrl = (): string => {
  // Check for Next.js/SSR environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // In CI/E2E tests with Docker, use the service name from docker-compose
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // If running in the context of CI/CD but no explicit API URL
  if (process.env.CI === 'true') {
    return 'http://localhost:8000';
  }

  // Default for local development
  return '';
};

const API = {
  // Export getBaseUrl for testing
  getBaseUrl,

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/campaigns/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Campaign[];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Endorsers
  getEndorsers: async (): Promise<Endorser[]> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/endorsers/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Endorser[];
    } catch (error) {
      console.error('Error fetching endorsers:', error);
      throw error;
    }
  },

  // Legislators
  getLegislators: async (): Promise<Legislator[]> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/legislators/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Legislator[];
    } catch (error) {
      console.error('Error fetching legislators:', error);
      throw error;
    }
  },

  // Endorsements
  getEndorsements: async (): Promise<Endorsement[]> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/endorsements/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Endorsement[];
    } catch (error) {
      console.error('Error fetching endorsements:', error);
      throw error;
    }
  },

  getCampaignEndorsements: async (campaignId: number): Promise<Endorsement[]> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/endorsements/?campaign_id=${campaignId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Endorsement[];
    } catch (error) {
      console.error('Error fetching campaign endorsements:', error);
      throw error;
    }
  },

  createEndorsement: async (endorsementData: EndorsementCreate): Promise<Endorsement> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/endorsements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endorsementData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Endorsement;
    } catch (error) {
      console.error('Error creating endorsement:', error);
      throw error;
    }
  },

  getCampaignById: async (campaignId: number): Promise<Campaign> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/campaigns/${campaignId}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  getCampaignByName: async (name: string): Promise<Campaign> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/campaigns/by-name/${name}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as Campaign;
    } catch (error) {
      console.error('Error fetching campaign by name:', error);
      throw error;
    }
  },

  // Homepage
  getHomepage: async (): Promise<HomePage> => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/homepage/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as HomePage;
    } catch (error) {
      console.error('Error fetching homepage:', error);
      throw error;
    }
  },
};

export default API;
