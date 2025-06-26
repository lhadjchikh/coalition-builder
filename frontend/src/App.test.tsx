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
      },
    ]);
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
      },
    ]);

    // Wait for campaigns to load
    await waitFor(() => {
      expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    });

    // Verify API was called
    expect(API.getCampaigns).toHaveBeenCalledTimes(1);

    // Verify campaign data is displayed
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
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
