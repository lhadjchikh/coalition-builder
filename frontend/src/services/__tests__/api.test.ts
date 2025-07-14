import API from '../api';
import {
  Campaign,
  Endorser,
  Legislator,
  Endorsement,
  EndorsementCreate,
  HomePage,
} from '../../types';
import { withSuppressedErrors } from '../../tests/utils/testUtils';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Service', () => {
  const originalEnv = process.env;

  // Helper to create clean environment without CI variables affecting tests
  const createCleanEnv = (
    overrides: Record<string, string | undefined> = {}
  ): NodeJS.ProcessEnv => ({
    ...Object.fromEntries(
      Object.entries(originalEnv).filter(
        ([key]) => !['CI', 'NEXT_PUBLIC_API_URL', 'REACT_APP_API_URL'].includes(key)
      )
    ),
    // Ensure required properties are present for NodeJS.ProcessEnv
    NODE_ENV: originalEnv.NODE_ENV || 'test',
    PUBLIC_URL: originalEnv.PUBLIC_URL || '',
    PATH: originalEnv.PATH || '',
    HOME: originalEnv.HOME || '',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Start with clean environment for each test
    jest.replaceProperty(process, 'env', createCleanEnv());
    // Reset window to undefined for most tests (simulating SSR context)
    delete (global as any).window;
  });

  afterAll(() => {
    // Restore original environment
    jest.replaceProperty(process, 'env', originalEnv);
  });

  describe('getBaseUrl', () => {
    it('should return REACT_APP_API_URL when set', () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          REACT_APP_API_URL: 'https://react-api.example.com',
        })
      );
      expect(API.getBaseUrl()).toBe('https://react-api.example.com');
    });

    it('should return localhost:8000 when in CI environment', () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          CI: 'true',
        })
      );
      expect(API.getBaseUrl()).toBe('http://localhost:8000');
    });

    it('should return empty string for production and development (relative paths)', () => {
      // Default behavior: no environment variables set
      // Should return empty string for relative paths
      expect(API.getBaseUrl()).toBe('');
    });
  });

  describe('getCampaigns', () => {
    const mockCampaigns: Campaign[] = [
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'Test summary',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
      },
    ];

    it('should fetch campaigns successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      });

      const campaigns = await API.getCampaigns();
      expect(campaigns).toEqual(mockCampaigns);
      expect(mockFetch).toHaveBeenCalledWith('/api/campaigns/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(API.getCampaigns()).rejects.toThrow('HTTP error! status: 404');
      });
    });

    it('should handle network failures', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(API.getCampaigns()).rejects.toThrow('Network error');
      });
    });

    it('should use correct URL with explicit API URL', async () => {
      jest.replaceProperty(
        process,
        'env',
        createCleanEnv({
          REACT_APP_API_URL: 'https://api.example.com',
        })
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      });

      await API.getCampaigns();
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/campaigns/');
    });
  });

  describe('getEndorsers', () => {
    const mockEndorsers: Endorser[] = [
      {
        id: 1,
        name: 'John Doe',
        organization: 'Test Org',
        email: 'john@example.com',
        state: 'CA',
        type: 'individual',
      },
    ];

    it('should fetch endorsers successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEndorsers,
      });

      const endorsers = await API.getEndorsers();
      expect(endorsers).toEqual(mockEndorsers);
      expect(mockFetch).toHaveBeenCalledWith('/api/endorsers/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(API.getEndorsers()).rejects.toThrow('HTTP error! status: 500');
      });
    });
  });

  describe('getLegislators', () => {
    const mockLegislators: Legislator[] = [
      {
        id: 1,
        first_name: 'Jane',
        last_name: 'Smith',
        chamber: 'Senate',
        state: 'CA',
      },
    ];

    it('should fetch legislators successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLegislators,
      });

      const legislators = await API.getLegislators();
      expect(legislators).toEqual(mockLegislators);
      expect(mockFetch).toHaveBeenCalledWith('/api/legislators/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 403'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
        });

        await expect(API.getLegislators()).rejects.toThrow('HTTP error! status: 403');
      });
    });
  });

  describe('getEndorsements', () => {
    const mockEndorsements: Endorsement[] = [
      {
        id: 1,
        stakeholder: {
          id: 1,
          name: 'John Doe',
          organization: 'Test Org',
          email: 'john@example.com',
          street_address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90001',
          type: 'individual',
        },
        campaign: {
          id: 1,
          name: 'test-campaign',
          title: 'Test Campaign',
          summary: 'Test summary',
          active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
        statement: 'I support this campaign',
        public_display: true,
        created_at: '2023-01-01T00:00:00Z',
      },
    ];

    it('should fetch endorsements successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEndorsements,
      });

      const endorsements = await API.getEndorsements();
      expect(endorsements).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith('/api/endorsements/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 401'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        await expect(API.getEndorsements()).rejects.toThrow('HTTP error! status: 401');
      });
    });
  });

  describe('getCampaignEndorsements', () => {
    const mockEndorsements: Endorsement[] = [
      {
        id: 1,
        stakeholder: {
          id: 1,
          name: 'John Doe',
          organization: 'Test Org',
          email: 'john@example.com',
          street_address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90001',
          type: 'individual',
        },
        campaign: {
          id: 1,
          name: 'test-campaign',
          title: 'Test Campaign',
          summary: 'Test summary',
          active: true,
          created_at: '2023-01-01T00:00:00Z',
        },
        statement: 'I support this campaign',
        public_display: true,
        created_at: '2023-01-01T00:00:00Z',
      },
    ];

    it('should fetch campaign endorsements successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEndorsements,
      });

      const endorsements = await API.getCampaignEndorsements(1);
      expect(endorsements).toEqual(mockEndorsements);
      expect(mockFetch).toHaveBeenCalledWith('/api/endorsements/?campaign_id=1');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(API.getCampaignEndorsements(1)).rejects.toThrow('HTTP error! status: 404');
      });
    });

    it('should use relative URL for production (default behavior)', async () => {
      // Default behavior: no environment variables set
      // Should use relative paths in production

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEndorsements,
      });

      await API.getCampaignEndorsements(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/endorsements/?campaign_id=1');
    });
  });

  describe('createEndorsement', () => {
    const mockEndorsementData: EndorsementCreate = {
      campaign_id: 1,
      stakeholder: {
        name: 'John Doe',
        organization: 'Test Org',
        email: 'john@example.com',
        street_address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip_code: '90001',
        type: 'individual',
      },
      statement: 'I support this campaign',
      public_display: true,
      terms_accepted: true,
    };

    const mockCreatedEndorsement: Endorsement = {
      id: 1,
      stakeholder: {
        id: 1,
        name: 'John Doe',
        organization: 'Test Org',
        email: 'john@example.com',
        street_address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip_code: '90001',
        type: 'individual',
      },
      campaign: {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'Test summary',
        active: true,
        created_at: '2023-01-01T00:00:00Z',
      },
      statement: 'I support this campaign',
      public_display: true,
      created_at: '2023-01-01T00:00:00Z',
    };

    it('should create endorsement successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedEndorsement,
      });

      const endorsement = await API.createEndorsement(mockEndorsementData);
      expect(endorsement).toEqual(mockCreatedEndorsement);
      expect(mockFetch).toHaveBeenCalledWith('/api/endorsements/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockEndorsementData),
      });
    });

    it('should handle HTTP error responses with error details', async () => {
      await withSuppressedErrors(['Invalid endorsement data'], async () => {
        const errorData = { detail: 'Invalid endorsement data' };
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorData,
        });

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow(
          'Invalid endorsement data'
        );
      });
    });

    it('should handle HTTP error responses without error details', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        });

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow(
          'HTTP error! status: 500'
        );
      });
    });

    it('should handle network failures during creation', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(API.createEndorsement(mockEndorsementData)).rejects.toThrow('Network error');
      });
    });
  });

  describe('getCampaignById', () => {
    const mockCampaign: Campaign = {
      id: 1,
      name: 'test-campaign',
      title: 'Test Campaign',
      summary: 'Test summary',
      active: true,
      created_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch campaign by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaign,
      });

      const campaign = await API.getCampaignById(1);
      expect(campaign).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith('/api/campaigns/1/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(API.getCampaignById(1)).rejects.toThrow('HTTP error! status: 404');
      });
    });
  });

  describe('getCampaignByName', () => {
    const mockCampaign: Campaign = {
      id: 1,
      name: 'test-campaign',
      title: 'Test Campaign',
      summary: 'Test summary',
      active: true,
      created_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch campaign by name successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaign,
      });

      const campaign = await API.getCampaignByName('test-campaign');
      expect(campaign).toEqual(mockCampaign);
      expect(mockFetch).toHaveBeenCalledWith('/api/campaigns/by-name/test-campaign/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 404'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(API.getCampaignByName('nonexistent')).rejects.toThrow(
          'HTTP error! status: 404'
        );
      });
    });
  });

  describe('getHomepage', () => {
    const mockHomepage: HomePage = {
      id: 1,
      organization_name: 'Test Org',
      tagline: 'Test tagline',
      hero_title: 'Hero Title',
      hero_subtitle: 'Hero Subtitle',
      hero_background_image: 'hero.jpg',
      about_section_title: 'About',
      about_section_content: 'About content',
      cta_title: 'CTA Title',
      cta_content: 'CTA content',
      cta_button_text: 'Click me',
      cta_button_url: 'https://example.com',
      contact_email: 'contact@example.com',
      contact_phone: '555-1234',
      facebook_url: 'https://facebook.com/test',
      twitter_url: 'https://twitter.com/test',
      instagram_url: 'https://instagram.com/test',
      linkedin_url: 'https://linkedin.com/test',
      campaigns_section_title: 'Campaigns',
      campaigns_section_subtitle: 'Our campaigns',
      show_campaigns_section: true,
      content_blocks: [],
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    it('should fetch homepage successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHomepage,
      });

      const homepage = await API.getHomepage();
      expect(homepage).toEqual(mockHomepage);
      expect(mockFetch).toHaveBeenCalledWith('/api/homepage/');
    });

    it('should handle HTTP error responses', async () => {
      await withSuppressedErrors(['HTTP error! status: 500'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(API.getHomepage()).rejects.toThrow('HTTP error! status: 500');
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed JSON responses', async () => {
      await withSuppressedErrors(['Invalid JSON'], async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(API.getCampaigns()).rejects.toThrow('Invalid JSON');
      });
    });

    it('should handle fetch rejections', async () => {
      await withSuppressedErrors(['Fetch failed'], async () => {
        mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

        await expect(API.getCampaigns()).rejects.toThrow('Fetch failed');
      });
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const campaigns = await API.getCampaigns();
      expect(campaigns).toBeNull();
    });
  });

  describe('Console logging', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log errors when requests fail', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValueOnce(error);

      await expect(API.getCampaigns()).rejects.toThrow('Network error');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaigns:', error);
    });

    it('should log errors when endorsement creation fails', async () => {
      const error = new Error('Creation failed');
      mockFetch.mockRejectedValueOnce(error);

      const endorsementData: EndorsementCreate = {
        campaign_id: 1,
        stakeholder: {
          name: 'John Doe',
          organization: 'Test Org',
          email: 'john@example.com',
          street_address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90001',
          type: 'individual',
        },
        statement: 'I support this campaign',
        public_display: true,
        terms_accepted: true,
      };

      await expect(API.createEndorsement(endorsementData)).rejects.toThrow('Creation failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error creating endorsement:', error);
    });
  });
});
