import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CampaignDetail from '@pages/CampaignDetail';
import API from '@services/api';

// Mock the API module
jest.mock('@services/api');

// Mock the shared components
jest.mock('@shared/components/CampaignDetail', () => ({
  __esModule: true,
  default: ({ campaignId, initialCampaign, apiClient }: any) => (
    <div data-testid="campaign-detail">
      <div data-testid="campaign-id">{campaignId}</div>
      {initialCampaign && (
        <>
          <div data-testid="campaign-title">{initialCampaign.title}</div>
          <div data-testid="campaign-summary">{initialCampaign.summary}</div>
        </>
      )}
      {apiClient && <div data-testid="api-client">API Client Available</div>}
    </div>
  ),
}));

jest.mock('@shared/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock('@shared/components/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ name: 'clean-water' }),
}));

describe('CampaignDetail Page', () => {
  const mockCampaign = {
    id: 1,
    name: 'clean-water',
    title: 'Clean Water Initiative',
    summary: 'Ensuring access to clean water for all communities',
    description: 'Detailed description of the clean water initiative...',
    image_url: 'https://example.com/water.jpg',
    image_alt_text: 'Clean water flowing',
    endorsement_statement: 'I support clean water access',
    allow_endorsements: true,
    endorsement_form_instructions: 'Please fill out all fields',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
  };

  const mockHomepage = {
    id: 1,
    organization_name: 'Test Organization',
    tagline: 'Working together',
    hero_title: 'Welcome',
    hero_subtitle: 'Making a difference',
    hero_background_image_url: '',
    cta_title: 'Join Us',
    cta_content: 'Be part of the change',
    cta_button_text: 'Get Started',
    cta_button_url: '/contact',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Our Campaigns',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should fetch and display campaign successfully', async () => {
    (API.getCampaignByName as jest.Mock).mockResolvedValue(mockCampaign);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    // Initially shows loading state
    expect(screen.getByText('Loading campaign...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      expect(screen.getByTestId('campaign-id')).toHaveTextContent('1');
      expect(screen.getByTestId('campaign-title')).toHaveTextContent('Clean Water Initiative');
      expect(screen.getByTestId('campaign-summary')).toHaveTextContent(
        'Ensuring access to clean water for all communities'
      );
      expect(screen.getByTestId('api-client')).toHaveTextContent('API Client Available');
    });

    expect(API.getCampaignByName).toHaveBeenCalledWith('clean-water');
    expect(API.getHomepage).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    // Set up API mock to delay resolution
    (API.getCampaignByName as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getHomepage as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
    expect(screen.queryByTestId('campaign-detail')).not.toBeInTheDocument();
  });

  it('should handle campaign not found', async () => {
    (API.getCampaignByName as jest.Mock).mockResolvedValue(null);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campaign not found')).toBeInTheDocument();
      expect(
        screen.getByText("The campaign you're looking for doesn't exist or couldn't be loaded.")
      ).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    const error = new Error('Network error');
    (API.getCampaignByName as jest.Mock).mockRejectedValue(error);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaign:', error);
    consoleSpy.mockRestore();
  });

  it('should handle inactive campaign', async () => {
    const inactiveCampaign = {
      ...mockCampaign,
      active: false,
    };
    (API.getCampaignByName as jest.Mock).mockResolvedValue(inactiveCampaign);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('campaign-title')).toHaveTextContent('Clean Water Initiative');
    });

    // Inactive campaigns should still be displayed
    expect(screen.getByTestId('campaign-id')).toHaveTextContent('1');
  });

  it('should handle campaign with missing optional fields', async () => {
    const minimalCampaign = {
      id: 2,
      name: 'minimal-campaign',
      title: 'Minimal Campaign',
      summary: 'A campaign with minimal data',
      active: true,
    };
    (API.getCampaignByName as jest.Mock).mockResolvedValue(minimalCampaign);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('campaign-id')).toHaveTextContent('2');
      expect(screen.getByTestId('campaign-title')).toHaveTextContent('Minimal Campaign');
      expect(screen.getByTestId('campaign-summary')).toHaveTextContent(
        'A campaign with minimal data'
      );
    });
  });

  it('should handle missing campaign name parameter', async () => {
    // Override useParams to return undefined name
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ name: undefined });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CampaignDetail />} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campaign name is required')).toBeInTheDocument();
    });

    expect(API.getCampaignByName).not.toHaveBeenCalled();
  });
});
