import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EndorsementsList from '../../components/EndorsementsList';
import { Endorsement } from '../../types';
import API from '../../services/api';
import { withSuppressedAPIErrors } from '../utils/testUtils';

// Mock the API
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

describe('EndorsementsList', () => {
  const mockEndorsements: Endorsement[] = [
    {
      id: 1,
      stakeholder: {
        id: 1,
        name: 'John Doe',
        organization: 'Test Organization',
        role: 'Manager',
        email: 'john@test.com',
        state: 'MD',
        county: 'Test County',
        type: 'business',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      campaign: {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'Test summary',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      statement: 'This is a great campaign that we fully support!',
      public_display: true,
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      stakeholder: {
        id: 2,
        name: 'Jane Smith',
        organization: 'Green Farms Coalition',
        role: 'Director',
        email: 'jane@greenfarms.org',
        state: 'VA',
        county: 'Fairfax County',
        type: 'nonprofit',
        created_at: '2024-01-02',
        updated_at: '2024-01-02',
      },
      campaign: {
        id: 1,
        name: 'test-campaign',
        title: 'Test Campaign',
        summary: 'Test summary',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      statement: 'Essential legislation for our environment.',
      public_display: true,
      created_at: '2024-01-20T14:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders endorsements list with endorsements', async () => {
    mockAPI.getEndorsements.mockResolvedValue(mockEndorsements);

    render(<EndorsementsList />);

    expect(screen.getByTestId('endorsements-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Endorsements (2)')).toBeInTheDocument();

    expect(screen.getByTestId('endorsement-1')).toBeInTheDocument();
    expect(screen.getByTestId('endorsement-2')).toBeInTheDocument();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(
      screen.getByText('"This is a great campaign that we fully support!"')
    ).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Green Farms Coalition')).toBeInTheDocument();
    expect(screen.getByText('"Essential legislation for our environment."')).toBeInTheDocument();
  });

  it('renders campaign-specific endorsements', async () => {
    mockAPI.getCampaignEndorsements.mockResolvedValue([mockEndorsements[0]]);

    render(<EndorsementsList campaignId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Endorsements (1)')).toBeInTheDocument();
    });
    expect(mockAPI.getCampaignEndorsements).toHaveBeenCalledWith(1);

    expect(screen.getByTestId('endorsement-1')).toBeInTheDocument();
    expect(screen.queryByTestId('endorsement-2')).not.toBeInTheDocument();
  });

  it('shows no endorsements message when list is empty', async () => {
    mockAPI.getEndorsements.mockResolvedValue([]);

    render(<EndorsementsList />);

    await waitFor(() => {
      expect(screen.getByTestId('no-endorsements')).toBeInTheDocument();
    });
    expect(
      screen.getByText('No endorsements yet. Be the first to endorse this campaign!')
    ).toBeInTheDocument();
  });

  it('shows error message when fetching fails', async () => {
    await withSuppressedAPIErrors(async () => {
      mockAPI.getEndorsements.mockRejectedValue(new Error('Network error'));

      render(<EndorsementsList />);

      await waitFor(() => {
        expect(screen.getByTestId('endorsements-error')).toBeInTheDocument();
      });
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('refreshes endorsements when refreshTrigger changes', async () => {
    mockAPI.getEndorsements.mockResolvedValue(mockEndorsements);

    const { rerender } = render(<EndorsementsList refreshTrigger={0} />);

    await waitFor(() => {
      expect(mockAPI.getEndorsements).toHaveBeenCalledTimes(1);
    });

    // Change refreshTrigger to simulate new endorsement added
    rerender(<EndorsementsList refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockAPI.getEndorsements).toHaveBeenCalledTimes(2);
    });
  });

  it('displays stakeholder information correctly', async () => {
    mockAPI.getEndorsements.mockResolvedValue([mockEndorsements[0]]);

    render(<EndorsementsList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Manager,')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test County, MD')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    mockAPI.getEndorsements.mockResolvedValue([mockEndorsements[0]]);

    render(<EndorsementsList />);

    await waitFor(() => {
      expect(screen.getByText('Endorsed on January 15, 2024')).toBeInTheDocument();
    });
  });
});
