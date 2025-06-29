import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import API from './services/api';
import { Campaign } from './types';

// Mock the API calls
jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    getCampaigns: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getHomepage: jest.fn(),
    getBaseUrl: jest.fn(() => ''),
  },
}));

describe('App component', () => {
  beforeEach(() => {
    // Default mock implementation for API calls
    (API.getCampaigns as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Coalition Builder title', () => {
    render(<App />);
    const headingElement = screen.getByText(/Coalition Builder/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders navigation elements', () => {
    render(<App />);
    const navButton = screen.getByText(/All Campaigns/i);
    expect(navButton).toBeInTheDocument();
  });

  test('renders demo information', () => {
    render(<App />);
    const demoHeading = screen.getByText(/Frontend Endorsement Demo/i);
    expect(demoHeading).toBeInTheDocument();

    const demoButton1 = screen.getByText(/Demo: View Campaign 1/i);
    const demoButton2 = screen.getByText(/Demo: View Campaign 2/i);
    expect(demoButton1).toBeInTheDocument();
    expect(demoButton2).toBeInTheDocument();
  });

  test('app header has correct styling', () => {
    render(<App />);
    const appHeader = screen.getByRole('banner');
    expect(appHeader).toHaveClass('App-header');
  });

  test('renders CampaignsList component', async () => {
    // Setup a delayed response to ensure we can see the loading state
    let resolvePromise: (value: Campaign[]) => void;
    const delayedResponse = new Promise<Campaign[]>(resolve => {
      resolvePromise = resolve;
    });

    (API.getCampaigns as jest.Mock).mockImplementationOnce(() => delayedResponse);

    render(<App />);

    // First it should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Resolve the promise after checking loading state
    resolvePromise!([
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);

    // Wait for campaigns to load
    await waitFor(() => {
      expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    });

    // Verify API was called (may be called multiple times by different components)
    expect(API.getCampaigns).toHaveBeenCalled();

    // Verify campaign data is displayed in campaigns list
    expect(screen.getByTestId('campaigns-list-campaign-1')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Create a delayed rejection
    let rejectPromise: (reason?: any) => void;
    const delayedRejection = new Promise<Campaign[]>((_, reject) => {
      rejectPromise = reject;
    });

    (API.getCampaigns as jest.Mock).mockImplementationOnce(() => delayedRejection);

    render(<App />);

    // First it should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Trigger the rejection after checking loading state
    rejectPromise!(new Error('API Error'));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();
  });
});
