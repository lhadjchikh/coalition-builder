import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignDetail from '../CampaignDetail';
import API from '../../services/api';
import { Campaign } from '../../types';
import { withSuppressedErrors } from '../../tests/utils/testUtils';

// Mock the API service
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

// Mock child components
jest.mock('../EndorsementForm', () => {
  return function MockEndorsementForm({
    campaign,
    onEndorsementSubmitted,
  }: {
    campaign: Campaign;
    onEndorsementSubmitted: () => void;
  }) {
    return (
      <div data-testid="endorsement-form">
        <span>Form for: {campaign.title}</span>
        <button onClick={onEndorsementSubmitted}>Submit Endorsement</button>
      </div>
    );
  };
});

jest.mock('../EndorsementsList', () => {
  return function MockEndorsementsList({
    campaignId,
    refreshTrigger,
  }: {
    campaignId: number;
    refreshTrigger: number;
  }) {
    return (
      <div data-testid="endorsements-list">
        <span>Endorsements for campaign: {campaignId}</span>
        <span>Refresh trigger: {refreshTrigger}</span>
      </div>
    );
  };
});

// Mock CSS import
jest.mock('../Endorsements.css', () => ({}));

const mockCampaign: Campaign = {
  id: 1,
  name: 'test-campaign',
  title: 'Test Campaign',
  summary: 'This is a test campaign summary',
  description: '<p>This is a <strong>detailed description</strong> of the campaign.</p>',
  active: true,
  created_at: '2023-01-01T00:00:00Z',
  allow_endorsements: true,
  endorsement_statement: 'I support this campaign',
  endorsement_form_instructions: 'Please fill out the form below',
};

describe('CampaignDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading states', () => {
    it('should show loading state initially', async () => {
      mockAPI.getCampaignById.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CampaignDetail campaignId={1} />);

      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
    });

    it('should show loading state when campaignName is provided', async () => {
      mockAPI.getCampaignByName.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CampaignDetail campaignName="test-campaign" />);

      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();
    });
  });

  describe('successful data fetching', () => {
    it('should fetch and display campaign by ID', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      expect(mockAPI.getCampaignById).toHaveBeenCalledWith(1);
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('This is a test campaign summary')).toBeInTheDocument();
    });

    it('should fetch and display campaign by name', async () => {
      mockAPI.getCampaignByName.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignName="test-campaign" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('test-campaign');
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should display campaign description when available', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByText('About This Campaign')).toBeInTheDocument();
        expect(screen.getByText('detailed description')).toBeInTheDocument();
      });
    });

    it('should not display description section when description is empty', async () => {
      const campaignWithoutDescription = { ...mockCampaign, description: undefined };
      mockAPI.getCampaignById.mockResolvedValue(campaignWithoutDescription);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      expect(screen.queryByText('About This Campaign')).not.toBeInTheDocument();
    });

    it('should render child components with correct props', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('endorsement-form')).toBeInTheDocument();
        expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
      });

      expect(screen.getByText('Form for: Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('Endorsements for campaign: 1')).toBeInTheDocument();
      expect(screen.getByText('Refresh trigger: 0')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error when campaign fetch by ID fails', async () => {
      await withSuppressedErrors(['Campaign not found'], async () => {
        const errorMessage = 'Campaign not found';
        mockAPI.getCampaignById.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          render(<CampaignDetail campaignId={1} />);
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('should display error when campaign fetch by name fails', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        const errorMessage = 'Network error';
        mockAPI.getCampaignByName.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          render(<CampaignDetail campaignName="test-campaign" />);
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      await withSuppressedErrors(['Failed to fetch campaign'], async () => {
        mockAPI.getCampaignById.mockRejectedValue('String error');

        await act(async () => {
          render(<CampaignDetail campaignId={1} />);
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText('Error: Failed to fetch campaign')).toBeInTheDocument();
      });
    });

    it('should display error when neither campaignId nor campaignName provided', async () => {
      await act(async () => {
        render(<CampaignDetail />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Error: Either campaignId or campaignName must be provided')
      ).toBeInTheDocument();
    });

    it('should display not found when campaign is null', async () => {
      // This shouldn't happen in normal flow, but testing edge case
      mockAPI.getCampaignById.mockResolvedValue(null as any);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-not-found')).toBeInTheDocument();
      });

      expect(screen.getByText('Campaign not found')).toBeInTheDocument();
    });
  });

  describe('endorsement refresh functionality', () => {
    it('should trigger endorsement refresh when handleEndorsementSubmitted is called', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh trigger: 0')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Endorsement');

      await act(async () => {
        submitButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh trigger: 1')).toBeInTheDocument();
      });
    });

    it('should increment refresh trigger multiple times', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh trigger: 0')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Endorsement');

      // Click multiple times
      await act(async () => {
        submitButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh trigger: 1')).toBeInTheDocument();
      });

      await act(async () => {
        submitButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh trigger: 2')).toBeInTheDocument();
      });
    });
  });

  describe('prop changes and re-fetching', () => {
    it('should re-fetch when campaignId changes', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      const { rerender } = render(<CampaignDetail campaignId={1} />);

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(1);
      });

      const newCampaign = { ...mockCampaign, id: 2, title: 'New Campaign' };
      mockAPI.getCampaignById.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(<CampaignDetail campaignId={2} />);
      });

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(2);
        expect(screen.getByText('New Campaign')).toBeInTheDocument();
      });
    });

    it('should re-fetch when campaignName changes', async () => {
      mockAPI.getCampaignByName.mockResolvedValue(mockCampaign);

      const { rerender } = render(<CampaignDetail campaignName="campaign-1" />);

      await waitFor(() => {
        expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('campaign-1');
      });

      const newCampaign = { ...mockCampaign, name: 'campaign-2', title: 'Second Campaign' };
      mockAPI.getCampaignByName.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(<CampaignDetail campaignName="campaign-2" />);
      });

      await waitFor(() => {
        expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('campaign-2');
        expect(screen.getByText('Second Campaign')).toBeInTheDocument();
      });
    });

    it('should switch from campaignId to campaignName', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      const { rerender } = render(<CampaignDetail campaignId={1} />);

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(1);
      });

      const newCampaign = { ...mockCampaign, name: 'new-campaign', title: 'New Campaign' };
      mockAPI.getCampaignByName.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(<CampaignDetail campaignName="new-campaign" />);
      });

      await waitFor(() => {
        expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('new-campaign');
        expect(screen.getByText('New Campaign')).toBeInTheDocument();
      });
    });
  });

  describe('loading state management', () => {
    it('should reset loading state properly on successful fetch', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: Campaign) => void;
      const controlledPromise = new Promise<Campaign>(resolve => {
        resolvePromise = resolve;
      });

      mockAPI.getCampaignById.mockReturnValue(controlledPromise);

      render(<CampaignDetail campaignId={1} />);

      // Should start with loading
      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockCampaign);
      });

      // Should transition to loaded state
      await waitFor(() => {
        expect(screen.queryByTestId('campaign-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });
    });

    it('should reset loading state properly on error', async () => {
      // Create a promise that we can control
      let rejectPromise: (error: Error) => void;
      const controlledPromise = new Promise<Campaign>((_, reject) => {
        rejectPromise = reject;
      });

      mockAPI.getCampaignById.mockReturnValue(controlledPromise);

      render(<CampaignDetail campaignId={1} />);

      // Should start with loading
      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();

      // Reject the promise
      await act(async () => {
        rejectPromise!(new Error('Test error'));
      });

      // Should transition to error state
      await waitFor(() => {
        expect(screen.queryByTestId('campaign-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
      });
    });

    it('should reset error state when retrying after error', async () => {
      await withSuppressedErrors(['First error'], async () => {
        mockAPI.getCampaignById.mockRejectedValue(new Error('First error'));

        const { rerender } = render(<CampaignDetail campaignId={1} />);

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        // Now return success
        mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

        await act(async () => {
          rerender(<CampaignDetail campaignId={2} />);
        });

        await waitFor(() => {
          expect(screen.queryByTestId('campaign-error')).not.toBeInTheDocument();
          expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        });
      });
    });
  });

  describe('HTML content rendering', () => {
    it('should safely render HTML description content', async () => {
      const campaignWithHTML = {
        ...mockCampaign,
        description: '<p>Campaign with <em>emphasized</em> and <strong>bold</strong> text.</p>',
      };
      mockAPI.getCampaignById.mockResolvedValue(campaignWithHTML);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        const emphasizedText = screen.getByText('emphasized');
        const boldText = screen.getByText('bold');

        expect(emphasizedText.tagName).toBe('EM');
        expect(boldText.tagName).toBe('STRONG');
      });
    });

    it('should handle empty HTML description', async () => {
      const campaignWithEmptyHTML = {
        ...mockCampaign,
        description: '',
      };
      mockAPI.getCampaignById.mockResolvedValue(campaignWithEmptyHTML);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(screen.queryByText('About This Campaign')).not.toBeInTheDocument();
      });
    });
  });

  describe('accessibility and semantic structure', () => {
    it('should have proper heading structure', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Test Campaign');

        const h2 = screen.getByRole('heading', { level: 2 });
        expect(h2).toHaveTextContent('About This Campaign');
      });
    });

    it('should have proper section structure', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        const sections = screen.getAllByRole('region');
        expect(sections.length).toBeGreaterThanOrEqual(2); // description + endorsements sections
      });
    });

    it('should have proper data-testid attributes', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        render(<CampaignDetail campaignId={1} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(screen.getByTestId('endorsement-form')).toBeInTheDocument();
        expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
      });
    });
  });
});
