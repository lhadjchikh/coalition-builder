import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import API from '../../services/api';
import { withSuppressedErrors } from '../utils/testUtils';

// Mock the API module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getCampaigns: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getHomepage: jest.fn(),
    getBaseUrl: jest.fn(() => ''),
  },
}));

describe('App Integration Test', () => {
  // Arrange - Setup mock data
  const mockCampaigns = [
    {
      id: 1,
      title: 'Save the Bay',
      name: 'save-the-bay',
      summary: 'Campaign to protect the Chesapeake Bay',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Clean Water Initiative',
      name: 'clean-water',
      summary: 'Ensuring clean water for all communities',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset and setup mocks before each test
    jest.clearAllMocks();

    // Mock implementation of getCampaigns
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

    // Mock homepage API to prevent errors in components that call it
    (API.getHomepage as jest.Mock).mockResolvedValue({
      id: 1,
      organization_name: 'Test Coalition',
      tagline: 'Building partnerships',
      hero_title: 'Welcome to Coalition Builder',
      hero_subtitle: 'Building strong advocacy partnerships',
      hero_background_image: '',
      about_section_title: 'About Our Mission',
      about_section_content: 'Test content',
      cta_title: 'Get Involved',
      cta_content: 'Join our coalition',
      cta_button_text: 'Join Now',
      cta_button_url: '/join',
      contact_email: 'contact@test.org',
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
    });
  });

  test('fetches and displays campaigns in the app', async () => {
    // Act - Render the App (without act to see initial loading state)
    render(<App />);

    // Initial loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Assert - Verify campaigns are displayed after loading
    await waitFor(() => {
      expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    });

    // Check that the API was called
    expect(API.getCampaigns).toHaveBeenCalled();

    // Verify both campaigns are displayed using test IDs from CampaignsList
    expect(screen.getByTestId('campaigns-list-campaign-1')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-list-campaign-2')).toBeInTheDocument();

    // Verify both campaigns are rendered with their content
    const campaign1 = screen.getByTestId('campaigns-list-campaign-1');
    const campaign2 = screen.getByTestId('campaigns-list-campaign-2');
    expect(campaign1).toBeInTheDocument();
    expect(campaign2).toBeInTheDocument();
  });

  test('displays app title and campaigns together', async () => {
    // Act - Render the App
    render(<App />);

    // Assert - Check for app title
    expect(screen.getByText('Coalition Builder')).toBeInTheDocument();

    // Wait for campaigns to load
    await waitFor(() => {
      expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    });

    // Verify that app title and campaigns list exist together
    expect(screen.getByText('Coalition Builder')).toBeInTheDocument();
    expect(screen.getByText('Policy Campaigns')).toBeInTheDocument();
    expect(screen.getByTestId('campaigns-list-campaign-1')).toBeInTheDocument();
  });

  test('handles API error in the app context', async () => {
    await withSuppressedErrors(['Failed to fetch data'], async () => {
      // Override the mock for this specific test to simulate an error
      (API.getCampaigns as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch data'));

      // Act - Render the App
      render(<App />);

      // Assert - Verify error state is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();

      // Verify that even with an error, the app header is still displayed
      expect(screen.getByText('Coalition Builder')).toBeInTheDocument();
    });
  });
});
