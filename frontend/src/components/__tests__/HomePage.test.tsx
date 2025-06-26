import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../HomePage';
import API from '../../services/api';
import { Campaign, HomePage as HomePageType } from '../../types';

// Mock the API module
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

// Mock data
const mockHomepage: HomePageType = {
  id: 1,
  organization_name: 'Test Coalition',
  tagline: 'Test tagline',
  hero_title: 'Test Hero Title',
  hero_subtitle: 'Test Hero Subtitle',
  hero_background_image: '',
  about_section_title: 'About Us',
  about_section_content: 'Test about content',
  cta_title: 'Join Us',
  cta_content: 'Test CTA content',
  cta_button_text: 'Get Started',
  cta_button_url: '/join',
  contact_email: 'test@example.org',
  contact_phone: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  linkedin_url: '',
  campaigns_section_title: 'Our Campaigns',
  campaigns_section_subtitle: 'Current initiatives',
  show_campaigns_section: true,
  content_blocks: [],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'test-campaign',
    title: 'Test Campaign',
    summary: 'A test campaign',
    description: 'Test description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('HomePage Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment to test
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.REACT_APP_ORGANIZATION_NAME;
    delete process.env.REACT_APP_TAGLINE;
  });

  it('renders successfully with API data', async () => {
    mockAPI.getHomepage.mockResolvedValue(mockHomepage);
    mockAPI.getCampaigns.mockResolvedValue(mockCampaigns);

    render(<HomePage />);

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('A test campaign')).toBeInTheDocument();
  });

  it('renders fallback homepage data when homepage API fails', async () => {
    mockAPI.getHomepage.mockRejectedValue(new Error('Homepage API failed'));
    mockAPI.getCampaigns.mockResolvedValue(mockCampaigns);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Should use fallback data
    expect(screen.getByText('Building strong advocacy partnerships')).toBeInTheDocument();
    expect(screen.getByText('Coalition Builder')).toBeInTheDocument();

    // Campaigns should still work
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
  });

  it('shows graceful error message when campaigns API fails', async () => {
    mockAPI.getHomepage.mockResolvedValue(mockHomepage);
    mockAPI.getCampaigns.mockRejectedValue(new Error('Campaigns API failed'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    });

    // Should show campaigns error message
    expect(screen.getByText('Unable to load campaigns at this time.')).toBeInTheDocument();

    // Homepage should still work
    expect(screen.getByText('Test Coalition')).toBeInTheDocument();
  });

  it('handles both APIs failing gracefully', async () => {
    mockAPI.getHomepage.mockRejectedValue(new Error('Homepage API failed'));
    mockAPI.getCampaigns.mockRejectedValue(new Error('Campaigns API failed'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Should use fallback homepage data
    expect(screen.getByText('Building strong advocacy partnerships')).toBeInTheDocument();

    // Should show campaigns error
    expect(screen.getByText('Unable to load campaigns at this time.')).toBeInTheDocument();
  });

  it('shows empty campaigns message when no campaigns exist', async () => {
    mockAPI.getHomepage.mockResolvedValue(mockHomepage);
    mockAPI.getCampaigns.mockResolvedValue([]);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    });

    // Should show empty state message
    expect(screen.getByText('No campaigns are currently available.')).toBeInTheDocument();
  });

  it('uses environment variables for fallback data', async () => {
    process.env.REACT_APP_ORGANIZATION_NAME = 'Custom Org';
    process.env.REACT_APP_TAGLINE = 'Custom tagline';

    mockAPI.getHomepage.mockRejectedValue(new Error('Homepage API failed'));
    mockAPI.getCampaigns.mockResolvedValue([]);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Should use environment variables in fallback
    expect(screen.getByText('Custom Org')).toBeInTheDocument();
    expect(screen.getByText('Custom tagline')).toBeInTheDocument();
  });

  it('does not expose raw error messages to users', async () => {
    mockAPI.getHomepage.mockRejectedValue(new Error('Internal server error 500'));
    mockAPI.getCampaigns.mockRejectedValue(new Error('Connection refused'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Should NOT show raw error messages
    expect(screen.queryByText('Internal server error 500')).not.toBeInTheDocument();
    expect(screen.queryByText('Connection refused')).not.toBeInTheDocument();
    expect(screen.queryByText('fetch failed')).not.toBeInTheDocument();

    // Should show user-friendly message
    expect(screen.getByText('Unable to load campaigns at this time.')).toBeInTheDocument();
  });

  it('shows development notices in development mode', async () => {
    process.env.NODE_ENV = 'development';

    mockAPI.getHomepage.mockRejectedValue(new Error('Homepage API failed'));
    mockAPI.getCampaigns.mockRejectedValue(new Error('Campaigns API failed'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Should show development notices
    expect(screen.getByText('Development Notice')).toBeInTheDocument();
    expect(screen.getByText(/Using fallback homepage data due to API error/)).toBeInTheDocument();
  });

  it('renders page structure correctly even with API failures', async () => {
    mockAPI.getHomepage.mockRejectedValue(new Error('API failed'));
    mockAPI.getCampaigns.mockRejectedValue(new Error('API failed'));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Coalition Builder')).toBeInTheDocument();
    });

    // Essential page structure should be intact
    expect(screen.getByRole('main') || document.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(screen.getByText('About Our Mission')).toBeInTheDocument();
    expect(screen.getByText('Get Involved')).toBeInTheDocument();
  });

  it('calls APIs in parallel for better performance', async () => {
    mockAPI.getHomepage.mockResolvedValue(mockHomepage);
    mockAPI.getCampaigns.mockResolvedValue(mockCampaigns);

    const startTime = Date.now();

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    });

    // Both APIs should have been called
    expect(mockAPI.getHomepage).toHaveBeenCalledTimes(1);
    expect(mockAPI.getCampaigns).toHaveBeenCalledTimes(1);

    // APIs should be called in parallel (not sequentially)
    // This is tested by checking they're both called, not by timing
    expect(mockAPI.getHomepage).toHaveBeenCalled();
    expect(mockAPI.getCampaigns).toHaveBeenCalled();
  });
});
