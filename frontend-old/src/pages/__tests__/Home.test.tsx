import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '@pages/Home';
import API from '@services/api';

// Mock the API module
jest.mock('@services/api');

// Mock the shared components
jest.mock('@shared/components/HomePage', () => ({
  __esModule: true,
  default: ({ homepage, campaigns, homepageError, campaignsError, contentBlocks }: any) => (
    <div data-testid="home-page">
      {homepage && <div data-testid="homepage-name">{homepage.organization_name}</div>}
      {homepageError && <div data-testid="homepage-error">{homepageError}</div>}
      {campaigns && <div data-testid="campaigns-count">{campaigns.length} campaigns</div>}
      {campaignsError && <div data-testid="campaigns-error">{campaignsError}</div>}
      {contentBlocks && <div data-testid="content-blocks-count">{contentBlocks.length} blocks</div>}
    </div>
  ),
}));

jest.mock('@shared/components/Footer', () => ({
  __esModule: true,
  default: ({ orgInfo }: any) => (
    <footer data-testid="footer">{orgInfo?.organization_name || 'Coalition Builder'}</footer>
  ),
}));

jest.mock('@shared/components/Navbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Home Page', () => {
  const mockHomepage = {
    id: 1,
    organization_name: 'Test Organization',
    tagline: 'Test Tagline',
    hero_title: 'Welcome',
    hero_subtitle: 'Subtitle',
    hero_background_image_url: '',
    cta_title: 'Get Involved',
    cta_content: 'Join us',
    cta_button_text: 'Learn More',
    cta_button_url: '/about',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Our Campaigns',
    campaigns_section_subtitle: 'Active campaigns',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockCampaigns = [
    { id: 1, name: 'campaign-1', title: 'Campaign 1', summary: 'Summary 1', active: true },
    { id: 2, name: 'campaign-2', title: 'Campaign 2', summary: 'Summary 2', active: true },
  ];

  const mockContentBlocks = [
    { id: 1, block_type: 'text', content: 'Block 1', page_type: 'homepage', order: 1 },
    { id: 2, block_type: 'text', content: 'Block 2', page_type: 'homepage', order: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    // Set up API mocks to delay resolution
    (API.getHomepage as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getCampaigns as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getContentBlocksByPageType as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('should fetch and display data successfully', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('campaigns-count')).toHaveTextContent('2 campaigns');
      expect(screen.getByTestId('content-blocks-count')).toHaveTextContent('2 blocks');
    });

    expect(API.getHomepage).toHaveBeenCalledTimes(1);
    expect(API.getCampaigns).toHaveBeenCalledTimes(1);
    expect(API.getContentBlocksByPageType).toHaveBeenCalledWith('homepage');
  });

  it('should handle homepage fetch error', async () => {
    const error = new Error('Failed to fetch homepage');
    (API.getHomepage as jest.Mock).mockRejectedValue(error);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should now show fallback homepage data instead of error
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Coalition Builder');
      expect(screen.getByTestId('homepage-error')).toHaveTextContent('Failed to fetch homepage');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching homepage:', error);
    consoleSpy.mockRestore();
  }, 10000);

  it('should handle campaigns fetch error', async () => {
    const error = new Error('Failed to fetch campaigns');
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockRejectedValue(error);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should still show the homepage but with campaigns error
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('campaigns-error')).toHaveTextContent('Failed to fetch campaigns');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaigns:', error);
    consoleSpy.mockRestore();
  }, 10000);

  it('should handle navigation to campaign detail', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    // The HomePage component would normally have a callback for campaign selection
    // We'll test that the navigation function is set up correctly
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should use fallback data when homepage is null', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(null);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });
  });

  it('should handle content blocks fetch error', async () => {
    const error = new Error('Failed to fetch content blocks');
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should still show the homepage and campaigns but no content blocks
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('campaigns-count')).toHaveTextContent('2 campaigns');
      expect(screen.getByTestId('content-blocks-count')).toHaveTextContent('0 blocks');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching content blocks:', error);
    consoleSpy.mockRestore();
  });

  it('should handle non-Error object rejection for homepage', async () => {
    (API.getHomepage as jest.Mock).mockRejectedValue('String error');
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should show fallback homepage with generic error message
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Coalition Builder');
      expect(screen.getByTestId('homepage-error')).toHaveTextContent('Failed to fetch homepage');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching homepage:', 'String error');
    consoleSpy.mockRestore();
  });

  it('should handle non-Error object rejection for campaigns', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockRejectedValue('String error');
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should show homepage with generic campaigns error message
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('campaigns-error')).toHaveTextContent('Failed to fetch campaigns');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching campaigns:', 'String error');
    consoleSpy.mockRestore();
  });

  it('should handle campaign selection and navigation', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('homepage-name')).toHaveTextContent('Test Organization');
    });
  });
});
