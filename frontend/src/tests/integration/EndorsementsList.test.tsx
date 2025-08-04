import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EndorsementsList from '../../components/EndorsementsList';
import { Endorsement } from '../../types';
import API from '../../services/api';
import { withSuppressedErrors } from '../utils/testUtils';

// Mock the API
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

describe('EndorsementsList', () => {
  const mockEndorsements: Endorsement[] = [
    {
      id: 1,
      stakeholder: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        organization: 'Test Organization',
        role: 'Manager',
        email: 'john@test.com',
        street_address: '123 Main St',
        city: 'Baltimore',
        state: 'MD',
        zip_code: '21201',
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
        first_name: 'Jane',
        last_name: 'Smith',
        organization: 'Green Farms Coalition',
        role: 'Director',
        email: 'jane@greenfarms.org',
        street_address: '456 Oak Ave',
        city: 'Arlington',
        state: 'VA',
        zip_code: '22201',
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
    await withSuppressedErrors(['Network error'], async () => {
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
    expect(screen.getByText('Baltimore, MD')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    mockAPI.getEndorsements.mockResolvedValue([mockEndorsements[0]]);

    render(<EndorsementsList />);

    await waitFor(() => {
      expect(screen.getByText('Endorsed on January 15, 2024')).toBeInTheDocument();
    });
  });

  describe('onCountUpdate callback functionality', () => {
    it('calls onCountUpdate with correct total count', async () => {
      const mockOnCountUpdate = jest.fn();
      mockAPI.getEndorsements.mockResolvedValue(mockEndorsements);

      render(<EndorsementsList onCountUpdate={mockOnCountUpdate} />);

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledWith(2, expect.any(Number));
      });
    });

    it('calls onCountUpdate with correct recent count for endorsements within 7 days', async () => {
      const mockOnCountUpdate = jest.fn();
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const endorsementsWithRecentDates = [
        { ...mockEndorsements[0], created_at: recentDate.toISOString() },
        { ...mockEndorsements[1], created_at: oldDate.toISOString() },
      ];

      mockAPI.getEndorsements.mockResolvedValue(endorsementsWithRecentDates);

      render(<EndorsementsList onCountUpdate={mockOnCountUpdate} />);

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledWith(2, 1); // 2 total, 1 recent
      });
    });

    it('calls onCountUpdate with zero recent count when no recent endorsements', async () => {
      const mockOnCountUpdate = jest.fn();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const endorsementsWithOldDates = mockEndorsements.map(endorsement => ({
        ...endorsement,
        created_at: oldDate.toISOString(),
      }));

      mockAPI.getEndorsements.mockResolvedValue(endorsementsWithOldDates);

      render(<EndorsementsList onCountUpdate={mockOnCountUpdate} />);

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledWith(2, 0); // 2 total, 0 recent
      });
    });

    it('calls onCountUpdate again when refreshTrigger changes', async () => {
      const mockOnCountUpdate = jest.fn();
      mockAPI.getEndorsements.mockResolvedValue(mockEndorsements);

      const { rerender } = render(
        <EndorsementsList onCountUpdate={mockOnCountUpdate} refreshTrigger={0} />
      );

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledTimes(1);
      });

      // Simulate new endorsement by changing refresh trigger
      const newEndorsements = [
        ...mockEndorsements,
        {
          id: 3,
          stakeholder: {
            id: 3,
            first_name: 'New',
            last_name: 'Endorser',
            organization: 'New Org',
            email: 'new@test.com',
            street_address: '789 Pine St',
            city: 'Los Angeles',
            state: 'CA',
            zip_code: '90001',
            type: 'individual' as const,
            created_at: '2024-01-03',
            updated_at: '2024-01-03',
          },
          campaign: mockEndorsements[0].campaign,
          statement: 'New endorsement',
          public_display: true,
          created_at: new Date().toISOString(),
        },
      ];

      mockAPI.getEndorsements.mockResolvedValue(newEndorsements);

      rerender(<EndorsementsList onCountUpdate={mockOnCountUpdate} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledTimes(2);
        expect(mockOnCountUpdate).toHaveBeenLastCalledWith(3, expect.any(Number));
      });
    });

    it('does not call onCountUpdate when callback is not provided', async () => {
      // This test ensures the component doesn't crash when onCountUpdate is undefined
      mockAPI.getEndorsements.mockResolvedValue(mockEndorsements);

      render(<EndorsementsList />);

      await waitFor(() => {
        expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
      });

      // No assertion needed - if we get here without crashing, the test passes
    });

    it('handles API errors gracefully and does not call onCountUpdate', async () => {
      const mockOnCountUpdate = jest.fn();

      await withSuppressedErrors(['API Error'], async () => {
        mockAPI.getEndorsements.mockRejectedValue(new Error('API Error'));

        render(<EndorsementsList onCountUpdate={mockOnCountUpdate} />);

        await waitFor(() => {
          expect(screen.getByTestId('endorsements-error')).toBeInTheDocument();
        });

        expect(mockOnCountUpdate).not.toHaveBeenCalled();
      });
    });

    it('calls onCountUpdate for campaign-specific endorsements', async () => {
      const mockOnCountUpdate = jest.fn();
      mockAPI.getCampaignEndorsements.mockResolvedValue([mockEndorsements[0]]);

      render(<EndorsementsList campaignId={1} onCountUpdate={mockOnCountUpdate} />);

      await waitFor(() => {
        expect(mockOnCountUpdate).toHaveBeenCalledWith(1, expect.any(Number));
      });

      expect(mockAPI.getCampaignEndorsements).toHaveBeenCalledWith(1);
    });
  });
});
