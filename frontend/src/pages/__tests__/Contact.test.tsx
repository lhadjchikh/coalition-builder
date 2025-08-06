import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Contact from '@pages/Contact';
import API from '@services/api';

// Mock the API module
jest.mock('@services/api');

// Mock the shared components
jest.mock('@shared/components/ContactPage', () => ({
  __esModule: true,
  default: ({ orgInfo, contentBlocks, error }: any) => (
    <div data-testid="contact-page">
      {orgInfo && <div data-testid="org-info">{orgInfo.organization_name}</div>}
      {error && <div data-testid="error">{error}</div>}
      {contentBlocks && <div data-testid="content-blocks">{contentBlocks.length} blocks</div>}
      <div data-testid="contact-form">Contact Form</div>
    </div>
  ),
}));

describe('Contact Page', () => {
  const mockHomepage = {
    id: 1,
    organization_name: 'Community Coalition',
    tagline: 'Together we are stronger',
    hero_title: 'Contact Us',
    hero_subtitle: 'Get in touch',
    hero_background_image_url: '',
    cta_title: 'Reach Out',
    cta_content: 'We would love to hear from you',
    cta_button_text: 'Send Message',
    cta_button_url: '',
    facebook_url: 'https://facebook.com/coalition',
    twitter_url: 'https://twitter.com/coalition',
    instagram_url: '',
    linkedin_url: 'https://linkedin.com/company/coalition',
    campaigns_section_title: 'Our Work',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  const mockContentBlocks = [
    { id: 1, block_type: 'text', content: 'Contact Information', page_type: 'contact', order: 1 },
    { id: 2, block_type: 'text', content: 'Office Hours', page_type: 'contact', order: 2 },
    { id: 3, block_type: 'map', content: 'Location Map', page_type: 'contact', order: 3 },
    { id: 4, block_type: 'form', content: 'Contact Form', page_type: 'contact', order: 4 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and display all data successfully', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-info')).toHaveTextContent('Community Coalition');
      expect(screen.getByTestId('content-blocks')).toHaveTextContent('4 blocks');
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    expect(API.getHomepage).toHaveBeenCalledTimes(1);
    expect(API.getContentBlocksByPageType).toHaveBeenCalledWith('contact');
  });

  it('should handle loading state', () => {
    // Set up API mocks to delay resolution
    (API.getHomepage as jest.Mock).mockReturnValue(new Promise(() => {}));
    (API.getContentBlocksByPageType as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('contact-page')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    (API.getHomepage as jest.Mock).mockRejectedValue(error);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching contact page data:', error);
    consoleSpy.mockRestore();
  });

  it('should handle partial data failure', async () => {
    // When Promise.all fails, both requests fail
    const error = new Error('Failed to fetch data');
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockRejectedValue(error);

    // Mock console.error to prevent test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Since Promise.all fails when any promise fails, homepage will be null
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching contact page data:', error);
    consoleSpy.mockRestore();
  });

  it('should handle empty content blocks', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-info')).toHaveTextContent('Community Coalition');
      expect(screen.getByTestId('content-blocks')).toHaveTextContent('0 blocks');
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });
  });

  it('should handle null homepage data', async () => {
    (API.getHomepage as jest.Mock).mockResolvedValue(null);
    (API.getContentBlocksByPageType as jest.Mock).mockResolvedValue(mockContentBlocks);

    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load page')).toBeInTheDocument();
      expect(screen.getByText('Please try again later.')).toBeInTheDocument();
    });

    // Should show error page when homepage is null
    expect(screen.queryByTestId('contact-page')).not.toBeInTheDocument();
  });
});
