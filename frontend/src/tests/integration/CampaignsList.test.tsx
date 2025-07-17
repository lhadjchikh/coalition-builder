import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CampaignsList from '../../components/CampaignsList';
import API from '../../services/api';
import { Campaign } from '../../types';

// Mock the API module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getCampaigns: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getBaseUrl: jest.fn(() => ''),
  },
}));

describe('CampaignsList Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('renders campaigns from API', async () => {
    // Mock data for the test
    const mockData: Campaign[] = [
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // Use delayed promise to ensure we can test loading state
    let resolveCampaigns: (_value: Campaign[]) => void;
    const campaignsPromise = new Promise<Campaign[]>(resolve => {
      resolveCampaigns = resolve;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    await act(async () => {
      render(<CampaignsList />);
    });

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolveCampaigns!(mockData);
      await campaignsPromise;
    });

    // Wait for the component to update
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // Verify API was called
    expect(API.getCampaigns).toHaveBeenCalledTimes(1);

    // Check that campaign data is displayed
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('This is a test campaign')).toBeInTheDocument();
  });

  test('handles API error states', async () => {
    // Use delayed promise to ensure we can test loading state
    let rejectCampaigns: (_reason: Error) => void;
    const campaignsPromise = new Promise<Campaign[]>((_, reject) => {
      rejectCampaigns = reject;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    await act(async () => {
      render(<CampaignsList />);
    });

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Reject the promise
    await act(async () => {
      rejectCampaigns!(new Error('API Error'));
      try {
        await campaignsPromise;
      } catch {
        // Expected rejection
      }
    });

    // Wait for the error message
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('error')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();
  });

  test('handles empty response from API', async () => {
    // Use delayed promise to ensure we can test loading state
    let resolveCampaigns: (_value: Campaign[]) => void;
    const campaignsPromise = new Promise<Campaign[]>(resolve => {
      resolveCampaigns = resolve;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    await act(async () => {
      render(<CampaignsList />);
    });

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Resolve with empty array
    await act(async () => {
      resolveCampaigns!([]);
      await campaignsPromise;
    });

    // Wait for the component to load
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    expect(screen.getByText('No campaigns found')).toBeInTheDocument();
  });

  test('calls onCampaignSelect when View Campaign button is clicked', async () => {
    // Mock data for the test
    const mockData: Campaign[] = [
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // Use delayed promise
    let resolveCampaigns: (_value: Campaign[]) => void;
    const campaignsPromise = new Promise<Campaign[]>(resolve => {
      resolveCampaigns = resolve;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    // Mock callback function
    const mockOnCampaignSelect = jest.fn();

    await act(async () => {
      render(<CampaignsList onCampaignSelect={mockOnCampaignSelect} />);
    });

    // Resolve the campaigns data
    await act(async () => {
      resolveCampaigns!(mockData);
      await campaignsPromise;
    });

    // Wait for the component to load
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // Find and click the View Campaign button
    const viewButton = screen.getByTestId('view-campaign-1');
    expect(viewButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(viewButton);
    });

    // Verify the callback was called with the correct campaign
    expect(mockOnCampaignSelect).toHaveBeenCalledTimes(1);
    expect(mockOnCampaignSelect).toHaveBeenCalledWith(mockData[0]);
  });

  test('renders without onCampaignSelect callback (optional prop)', async () => {
    // Mock data for the test
    const mockData: Campaign[] = [
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // Use delayed promise
    let resolveCampaigns: (_value: Campaign[]) => void;
    const campaignsPromise = new Promise<Campaign[]>(resolve => {
      resolveCampaigns = resolve;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    // Render without callback - should not throw an error
    await act(async () => {
      render(<CampaignsList />);
    });

    // Resolve the campaigns data
    await act(async () => {
      resolveCampaigns!(mockData);
      await campaignsPromise;
    });

    // Wait for the component to load
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // Find and click the View Campaign button - should not throw an error
    const viewButton = screen.getByTestId('view-campaign-1');
    expect(viewButton).toBeInTheDocument();

    // Clicking should not cause an error (graceful handling of missing callback)
    await act(async () => {
      expect(() => fireEvent.click(viewButton)).not.toThrow();
    });
  });

  test('renders campaign with image and description', async () => {
    // Mock data with image and long description
    const mockData: Campaign[] = [
      {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'This is a test campaign',
        description:
          'This is a very long description that should be truncated when displayed in the campaign card because it exceeds the 100 character limit set by the component logic.',
        image_url: 'https://example.com/image.jpg',
        image_alt_text: 'Test campaign image',
        allow_endorsements: true,
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    // Use delayed promise
    let resolveCampaigns: (_value: Campaign[]) => void;
    const campaignsPromise = new Promise<Campaign[]>(resolve => {
      resolveCampaigns = resolve;
    });

    (API.getCampaigns as jest.Mock).mockReturnValue(campaignsPromise);

    await act(async () => {
      render(<CampaignsList />);
    });

    // Resolve the campaigns data
    await act(async () => {
      resolveCampaigns!(mockData);
      await campaignsPromise;
    });

    // Wait for the component to load
    await act(async () => {
      await waitFor(
        () => {
          expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // Check that image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test campaign image');

    // Check that description is truncated
    const truncatedText = screen.getByText(
      /This is a very long description that should be truncated.../
    );
    expect(truncatedText).toBeInTheDocument();

    // Check that endorsements indicator is shown
    expect(screen.getByText('✓ Accepting endorsements')).toBeInTheDocument();
  });
});
