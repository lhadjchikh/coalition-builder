import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Campaigns from '@pages/Campaigns';
import API from '@services/api';

// Mock the API module
jest.mock('@services/api');

// Mock the shared components
jest.mock('@shared/components/CampaignsPage', () => ({
  __esModule: true,
  default: ({ homepage, campaigns, contentBlocks, campaignsError }: any) => (
    <div data-testid="campaigns-page">
      {homepage && <div data-testid="org-name">{homepage.organization_name}</div>}
      {campaigns && <div data-testid="campaigns-list">{campaigns.length} campaigns</div>}
      {campaignsError && <div data-testid="campaigns-error">{campaignsError}</div>}
      {contentBlocks && <div data-testid="content-blocks">{contentBlocks.length} blocks</div>}
    </div>
  ),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Campaigns Page', () => {
  const mockHomepage = {
    id: 1,
    organization_name: 'Test Coalition',
    tagline: 'Working together for change',
    hero_title: 'Our Campaigns',
    hero_subtitle: 'Active initiatives',
    hero_background_image_url: '',
    cta_title: 'Get Involved',
    cta_content: 'Support our campaigns',
    cta_button_text: 'Join Now',
    cta_button_url: '/contact',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Active Campaigns',
    campaigns_section_subtitle: 'Making a difference',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockCampaigns = [
    {
      id: 1,
      name: 'clean-water',
      title: 'Clean Water Initiative',
      summary: 'Ensuring access to clean water',
      active: true,
      created_at: '2023-01-01',
    },
    {
      id: 2,
      name: 'climate-action',
      title: 'Climate Action Now',
      summary: 'Fighting climate change together',
      active: true,
      created_at: '2023-02-01',
    },
    {
      id: 3,
      name: 'education-reform',
      title: 'Education Reform',
      summary: 'Better education for all',
      active: false,
      created_at: '2023-03-01',
    },
  ];

  const mockContentBlocks = [
    { id: 1, block_type: 'hero', content: 'Campaigns Hero', page_type: 'campaigns', order: 1 },
    { id: 2, block_type: 'text', content: 'Campaign Info', page_type: 'campaigns', order: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should fetch and display all data successfully', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-name')).toHaveTextContent('Test Coalition');
      expect(screen.getByTestId('campaigns-list')).toHaveTextContent('3 campaigns');
      expect(screen.getByTestId('content-blocks')).toHaveTextContent('2 blocks');
    });

    expect(API.getHomepage).toHaveBeenCalledTimes(1);
    expect(API.getCampaigns).toHaveBeenCalledTimes(1);
    expect(API.getContentBlocksByPageType).toHaveBeenCalledWith('campaigns');
  });

  it('should handle loading state', () => {
    // Set up API mocks to delay resolution
    (API.getHomepage as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getCampaigns as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getContentBlocksByPageType as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('campaigns-page')).not.toBeInTheDocument();
  });

  it('should handle campaigns fetch error', async () => {
    // When Promise.all fails, all requests fail
    const error = new Error('Failed to fetch data');
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockRejectedValue(error);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Since Promise.all fails when any promise fails, homepage will be null
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaigns page data:', error);
    consoleSpy.mockRestore();
  });

  it('should handle complete API failure', async () => {
    const error = new Error('Network error');
    (API.getHomepage as jest.Mock).mockRejectedValue(error);
    (API.getCampaigns as jest.Mock).mockRejectedValue(error);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaigns page data:', error);
    consoleSpy.mockRestore();
  });

  it('should handle empty campaigns list', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue([]);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('campaigns-list')).toHaveTextContent('0 campaigns');
    });
  });

  it('should handle navigation setup', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Campaigns />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('campaigns-page')).toBeInTheDocument();
    });

    // Verify navigate function is available but not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
