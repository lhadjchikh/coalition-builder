import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CampaignsList from '../../components/CampaignsList';
import API from '../../services/api';
import { Campaign } from '../../types';

// Mock the API module
jest.mock('../../services/api', () => ({
  getCampaigns: jest.fn(),
  getEndorsers: jest.fn(),
  getLegislators: jest.fn(),
  getBaseUrl: jest.fn(() => ''),
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
        title: 'Test Campaign',
        slug: 'test-campaign',
        summary: 'This is a test campaign',
      },
    ];

    // Setup the API mock to return data
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockData);

    render(<CampaignsList />);

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the component to update with a longer timeout
    await waitFor(
      () => {
        expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify API was called
    expect(API.getCampaigns).toHaveBeenCalledTimes(1);

    // Check that campaign data is displayed
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('This is a test campaign')).toBeInTheDocument();
  });

  test('handles API error states', async () => {
    // Mock API error
    (API.getCampaigns as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<CampaignsList />);

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the error message with a longer timeout
    await waitFor(
      () => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();
  });

  test('handles empty response from API', async () => {
    // Mock empty array response
    (API.getCampaigns as jest.Mock).mockResolvedValue([]);

    render(<CampaignsList />);

    // Initially should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the component to load with a longer timeout
    await waitFor(
      () => {
        expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

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
      },
    ];

    // Setup the API mock to return data
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockData);

    // Mock callback function
    const mockOnCampaignSelect = jest.fn();

    render(<CampaignsList onCampaignSelect={mockOnCampaignSelect} />);

    // Wait for the component to load
    await waitFor(
      () => {
        expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click the View Campaign button
    const viewButton = screen.getByTestId('view-campaign-1');
    expect(viewButton).toBeInTheDocument();

    fireEvent.click(viewButton);

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
      },
    ];

    // Setup the API mock to return data
    (API.getCampaigns as jest.Mock).mockResolvedValue(mockData);

    // Render without callback - should not throw an error
    render(<CampaignsList />);

    // Wait for the component to load
    await waitFor(
      () => {
        expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click the View Campaign button - should not throw an error
    const viewButton = screen.getByTestId('view-campaign-1');
    expect(viewButton).toBeInTheDocument();

    // Clicking should not cause an error (graceful handling of missing callback)
    expect(() => fireEvent.click(viewButton)).not.toThrow();
  });
});
