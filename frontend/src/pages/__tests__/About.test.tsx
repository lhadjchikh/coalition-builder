import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import About from '../About';
import API from '../../services/api';

// Mock the API module
jest.mock('../../services/api');

// Mock the shared components
jest.mock('@shared/components/AboutPage', () => ({
  __esModule: true,
  default: ({ orgInfo, contentBlocks, error }: any) => (
    <div data-testid="about-page">
      {orgInfo && <div data-testid="org-name">{orgInfo.organization_name}</div>}
      {error && <div data-testid="error">{error}</div>}
      {contentBlocks && <div data-testid="content-blocks">{contentBlocks.length} blocks</div>}
    </div>
  ),
}));

describe('About Page', () => {
  const mockHomepage = {
    id: 1,
    organization_name: 'Test Organization',
    tagline: 'Building strong coalitions',
    hero_title: 'About Us',
    hero_subtitle: 'Our Story',
    hero_background_image_url: '',
    cta_title: 'Join Us',
    cta_content: 'Be part of our mission',
    cta_button_text: 'Get Involved',
    cta_button_url: '/contact',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Our Work',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockContentBlocks = [
    { id: 1, block_type: 'text', content: 'Our Mission', page_type: 'about', order: 1 },
    { id: 2, block_type: 'text', content: 'Our Vision', page_type: 'about', order: 2 },
    { id: 3, block_type: 'text', content: 'Our Values', page_type: 'about', order: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display data successfully', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <About />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('content-blocks')).toHaveTextContent('3 blocks');
    });

    expect(API.getHomepage).toHaveBeenCalledTimes(1);
    expect(API.getContentBlocksByPageType).toHaveBeenCalledWith('about');
  });

  it('should handle loading state', () => {
    // Set up API mocks to delay resolution
    (API.getHomepage as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getContentBlocksByPageType as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <About />
      </BrowserRouter>
    );

    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('about-page')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    (API.getHomepage as jest.Mock).mockRejectedValue(error);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <About />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching about page data:', error);
    consoleSpy.mockRestore();
  });

  it('should handle partial data fetch failure', async () => {
    // When Promise.all fails, both requests fail
    const error = new Error('Failed to fetch data');
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <About />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Since Promise.all fails when any promise fails, homepage will be null
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching about page data:', error);
    consoleSpy.mockRestore();
  });

  it('should display with empty content blocks', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <About />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-name')).toHaveTextContent('Test Organization');
      expect(screen.getByTestId('content-blocks')).toHaveTextContent('0 blocks');
    });
  });
});
