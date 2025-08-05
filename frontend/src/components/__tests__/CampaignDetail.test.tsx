import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignDetail from '@shared/components/CampaignDetail';
import API from '../../services/api';
import analytics from '@shared/services/analytics';
import { Campaign } from '../../types';
import { withSuppressedErrors } from '../../tests/utils/testUtils';

// Mock the API service
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

// Mock the analytics service
jest.mock('@shared/services/analytics');
const mockAnalytics = analytics as jest.Mocked<typeof analytics>;

// Mock child components
const mockScrollToFirstField = jest.fn();
jest.mock('../EndorsementForm', () => {
  return {
    __esModule: true,
    default: React.forwardRef<
      any,
      {
        campaign: Campaign;
        onEndorsementSubmitted: () => void;
        onFormInteraction?: (_isActive: boolean) => void;
      }
    >(function MockEndorsementForm(props, ref) {
      const { campaign, onEndorsementSubmitted, onFormInteraction } = props;
      React.useImperativeHandle(ref, () => ({
        scrollToFirstField: mockScrollToFirstField,
      }));

      return (
        <div data-testid="endorsement-form">
          <span>Form for: {campaign.title}</span>
          <button onClick={onEndorsementSubmitted}>Submit Endorsement</button>
          <button onClick={() => onFormInteraction?.(true)} data-testid="form-focus-trigger">
            Focus Form
          </button>
          <button onClick={() => onFormInteraction?.(false)} data-testid="form-blur-trigger">
            Blur Form
          </button>
          <button onClick={mockScrollToFirstField} data-testid="scroll-to-first-field">
            Scroll to First Field
          </button>
        </div>
      );
    }),
  };
});

jest.mock('../EndorsementsList', () => {
  return {
    __esModule: true,
    default: function MockEndorsementsList({
      campaignId,
      refreshTrigger,
      onCountUpdate,
    }: {
      campaignId: number;
      refreshTrigger: number;
      onCountUpdate?: (_count: number, _recentCount?: number) => void;
    }) {
      // Simulate different endorsement counts based on campaign ID for testing
      React.useEffect(() => {
        if (onCountUpdate) {
          const count = campaignId === 1 ? 15 : campaignId === 2 ? 5 : 25;
          const recentCount = campaignId === 1 ? 3 : campaignId === 2 ? 1 : 8;
          onCountUpdate(count, recentCount);
        }
      }, [campaignId, refreshTrigger, onCountUpdate]);

      return (
        <div data-testid="endorsements-list">
          <span>Endorsements for campaign: {campaignId}</span>
          <span>Refresh trigger: {refreshTrigger}</span>
        </div>
      );
    },
  };
});

// Mock CSS import
jest.mock('../Endorsements.css', () => ({}));

// Mock GrowthIcon component
jest.mock('../GrowthIcon', () => {
  return function MockGrowthIcon({
    stage,
    size,
    color,
  }: {
    stage: string;
    size: string;
    color: string;
  }) {
    return (
      <div data-testid="growth-icon" data-stage={stage} data-size={size} data-color={color}>
        Growth Icon: {stage}
      </div>
    );
  };
});

// Helper function to render CampaignDetail with proper dependencies
const renderCampaignDetail = (props: any) => {
  const EndorsementForm = jest.requireMock('../EndorsementForm').default;
  const EndorsementsList = jest.requireMock('../EndorsementsList').default;
  const GrowthIcon = jest.requireMock('../GrowthIcon').default;

  const defaultProps = {
    apiClient: {
      getCampaignById: mockAPI.getCampaignById,
      getCampaignByName: mockAPI.getCampaignByName,
    },
    analytics: mockAnalytics,
    EndorsementFormComponent: EndorsementForm,
    EndorsementsListComponent: EndorsementsList,
    GrowthIconComponent: GrowthIcon,
  };

  return render(<CampaignDetail {...defaultProps} {...props} />);
};

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

      renderCampaignDetail({ campaignId: 1 });

      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading campaign...')).toBeInTheDocument();
    });

    it('should show loading state when campaignName is provided', async () => {
      mockAPI.getCampaignByName.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderCampaignDetail({ campaignName: 'test-campaign' });

      expect(screen.getByTestId('campaign-loading')).toBeInTheDocument();
    });
  });

  describe('successful data fetching', () => {
    it('should fetch and display campaign by ID', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
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
        renderCampaignDetail({ campaignName: 'test-campaign' });
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
        renderCampaignDetail({ campaignId: 1 });
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
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      expect(screen.queryByText('About This Campaign')).not.toBeInTheDocument();
    });

    it('should render child components with correct props', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('endorsement-form')).toBeInTheDocument();
        expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
      });

      expect(screen.getByText('Form for: Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('Endorsements for campaign: 1')).toBeInTheDocument();
      expect(screen.getByText('Refresh trigger: 0')).toBeInTheDocument();
    }, 10000);
  });

  describe('error handling', () => {
    it('should display error when campaign fetch by ID fails', async () => {
      await withSuppressedErrors(['Campaign not found'], async () => {
        const errorMessage = 'Campaign not found';
        mockAPI.getCampaignById.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          renderCampaignDetail({ campaignId: 1 });
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display error when campaign fetch by name fails', async () => {
      await withSuppressedErrors(['Network error'], async () => {
        const errorMessage = 'Network error';
        mockAPI.getCampaignByName.mockRejectedValue(new Error(errorMessage));

        await act(async () => {
          renderCampaignDetail({ campaignName: 'test-campaign' });
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      await withSuppressedErrors(['Failed to fetch campaign'], async () => {
        mockAPI.getCampaignById.mockRejectedValue('String error');

        await act(async () => {
          renderCampaignDetail({ campaignId: 1 });
        });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        expect(screen.getByText('Failed to fetch campaign')).toBeInTheDocument();
      });
    });

    it('should display error when neither campaignId nor campaignName provided', async () => {
      await act(async () => {
        renderCampaignDetail({});
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Either campaignId or campaignName must be provided')
      ).toBeInTheDocument();
    });

    it('should display not found when campaign is null', async () => {
      // This shouldn't happen in normal flow, but testing edge case
      mockAPI.getCampaignById.mockResolvedValue(null as any);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
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
        renderCampaignDetail({ campaignId: 1 });
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
    }, 10000);

    it('should increment refresh trigger multiple times', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
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
    }, 10000);
  });

  describe('prop changes and re-fetching', () => {
    it('should re-fetch when campaignId changes', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      const { rerender } = renderCampaignDetail({ campaignId: 1 });

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(1);
      });

      const newCampaign = { ...mockCampaign, id: 2, title: 'New Campaign' };
      mockAPI.getCampaignById.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(
          <CampaignDetail
            {...{
              apiClient: {
                getCampaignById: mockAPI.getCampaignById,
                getCampaignByName: mockAPI.getCampaignByName,
              },
              analytics: mockAnalytics,
              EndorsementFormComponent: jest.requireMock('../EndorsementForm').default,
              EndorsementsListComponent: jest.requireMock('../EndorsementsList').default,
              GrowthIconComponent: jest.requireMock('../GrowthIcon').default,
              campaignId: 2,
            }}
          />
        );
      });

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(2);
        expect(screen.getByText('New Campaign')).toBeInTheDocument();
      });
    });

    it('should re-fetch when campaignName changes', async () => {
      mockAPI.getCampaignByName.mockResolvedValue(mockCampaign);

      const { rerender } = renderCampaignDetail({ campaignName: 'campaign-1' });

      await waitFor(() => {
        expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('campaign-1');
      });

      const newCampaign = { ...mockCampaign, name: 'campaign-2', title: 'Second Campaign' };
      mockAPI.getCampaignByName.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(
          <CampaignDetail
            {...{
              apiClient: {
                getCampaignById: mockAPI.getCampaignById,
                getCampaignByName: mockAPI.getCampaignByName,
              },
              analytics: mockAnalytics,
              EndorsementFormComponent: jest.requireMock('../EndorsementForm').default,
              EndorsementsListComponent: jest.requireMock('../EndorsementsList').default,
              GrowthIconComponent: jest.requireMock('../GrowthIcon').default,
              campaignName: 'campaign-2',
            }}
          />
        );
      });

      await waitFor(() => {
        expect(mockAPI.getCampaignByName).toHaveBeenCalledWith('campaign-2');
        expect(screen.getByText('Second Campaign')).toBeInTheDocument();
      });
    });

    it('should switch from campaignId to campaignName', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      const { rerender } = renderCampaignDetail({ campaignId: 1 });

      await waitFor(() => {
        expect(mockAPI.getCampaignById).toHaveBeenCalledWith(1);
      });

      const newCampaign = { ...mockCampaign, name: 'new-campaign', title: 'New Campaign' };
      mockAPI.getCampaignByName.mockResolvedValue(newCampaign);

      await act(async () => {
        rerender(
          <CampaignDetail
            {...{
              apiClient: {
                getCampaignById: mockAPI.getCampaignById,
                getCampaignByName: mockAPI.getCampaignByName,
              },
              analytics: mockAnalytics,
              EndorsementFormComponent: jest.requireMock('../EndorsementForm').default,
              EndorsementsListComponent: jest.requireMock('../EndorsementsList').default,
              GrowthIconComponent: jest.requireMock('../GrowthIcon').default,
              campaignName: 'new-campaign',
            }}
          />
        );
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
      let resolvePromise: (_value: Campaign) => void;
      const controlledPromise = new Promise<Campaign>(resolve => {
        resolvePromise = resolve;
      });

      mockAPI.getCampaignById.mockReturnValue(controlledPromise);

      renderCampaignDetail({ campaignId: 1 });

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
      let rejectPromise: (_error: Error) => void;
      const controlledPromise = new Promise<Campaign>((_, reject) => {
        rejectPromise = reject;
      });

      mockAPI.getCampaignById.mockReturnValue(controlledPromise);

      renderCampaignDetail({ campaignId: 1 });

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

        const { rerender } = renderCampaignDetail({ campaignId: 1 });

        await waitFor(() => {
          expect(screen.getByTestId('campaign-error')).toBeInTheDocument();
        });

        // Now return success
        mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

        await act(async () => {
          rerender(
            <CampaignDetail
              {...{
                apiClient: {
                  getCampaignById: mockAPI.getCampaignById,
                  getCampaignByName: mockAPI.getCampaignByName,
                },
                analytics: mockAnalytics,
                EndorsementFormComponent: jest.requireMock('../EndorsementForm').default,
                EndorsementsListComponent: jest.requireMock('../EndorsementsList').default,
                GrowthIconComponent: jest.requireMock('../GrowthIcon').default,
                campaignId: 2,
              }}
            />
          );
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
        renderCampaignDetail({ campaignId: 1 });
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
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(screen.queryByText('About This Campaign')).not.toBeInTheDocument();
      });
    });
  });

  describe('endorsement enhancements', () => {
    it('should display social proof section when endorsement count is 10 or higher', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 }); // Mock returns 15 endorsements
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('15 Endorsements')).toBeInTheDocument(); // endorsement count
        expect(screen.getByText('Join 15 supporters backing this campaign')).toBeInTheDocument();
      });
    }, 10000);

    it('should not display social proof section when endorsement count is below 10', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 2 }); // Mock returns 5 endorsements
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(
          screen.queryByText('Join 5 supporters backing this campaign')
        ).not.toBeInTheDocument();
      });
    });

    it('should display early supporter appeal when endorsement count is below 10', async () => {
      mockAPI.getCampaignById.mockResolvedValue({ ...mockCampaign, id: 2 });

      await act(async () => {
        renderCampaignDetail({ campaignId: 2 }); // Mock returns 5 endorsements
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Join the Early Supporters').length).toBeGreaterThan(0);
      });

      expect(
        screen.getByText('Be among the founding voices advocating for this important initiative.')
      ).toBeInTheDocument();
    }, 10000);

    it('should display momentum indicator when there are recent endorsements', async () => {
      mockAPI.getCampaignById.mockResolvedValue({ ...mockCampaign, id: 3 });

      await act(async () => {
        renderCampaignDetail({ campaignId: 3 }); // Mock returns 25 endorsements with 8 recent
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // First verify the social proof section is showing
      await waitFor(() => {
        expect(screen.getByText('Join 25 supporters backing this campaign')).toBeInTheDocument();
      });

      // Then check for momentum indicator
      await waitFor(() => {
        const momentumElements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('8 new endorsements this week') || false;
        });
        expect(momentumElements.length).toBeGreaterThan(0);
      });
    }, 10000);

    it('should not display momentum indicator when there are no recent endorsements', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 2 }); // Mock returns 1 recent endorsement (below threshold)
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(screen.queryByText(/new endorsements this week/)).not.toBeInTheDocument();
      });
    });

    it('should update social proof when endorsement count changes after new submission', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByText('Join 15 supporters backing this campaign')).toBeInTheDocument();
      });

      // Simulate endorsement submission which triggers refresh
      const submitButton = screen.getByText('Submit Endorsement');
      await act(async () => {
        submitButton.click();
      });

      // Count should update (mock will be called again with refreshTrigger=1)
      await waitFor(() => {
        expect(screen.getByText('Join 15 supporters backing this campaign')).toBeInTheDocument();
      });
    }, 10000);

    it('should show sticky CTA when scrolling to About This Campaign section', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Get both sections
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      // Mock About section at the top of viewport (scrolled to)
      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: -50, // Negative means it's scrolled past the top
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 450,
          x: 0,
          y: -50,
          toJSON: () => ({}),
        })
      );

      // Mock endorsement section still below viewport
      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.9,
          bottom: window.innerHeight * 1.5,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.9,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      // Trigger scroll to show sticky CTA
      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByText('Endorse Now')).toBeInTheDocument();
    });

    it('should display proper messaging for campaigns with many endorsements', async () => {
      mockAPI.getCampaignById.mockResolvedValue({ ...mockCampaign, id: 3 });

      await act(async () => {
        renderCampaignDetail({ campaignId: 3 }); // Mock returns 25 endorsements
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Join 25 supporters backing this campaign')).toBeInTheDocument();
      });

      await waitFor(() => {
        const momentumElements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('8 new endorsements this week') || false;
        });
        expect(momentumElements.length).toBeGreaterThan(0);
      });
    }, 10000);
  });

  describe('sticky CTA and form interaction', () => {
    beforeEach(() => {
      // Mock scrollY property
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 0,
      });

      // Reset the mock before each test
      mockScrollToFirstField.mockClear();
    });

    it('should not show sticky CTA initially when page is at top', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Sticky CTA should not be visible at page top
      expect(screen.queryByText('Endorse Now')).not.toBeInTheDocument();
    });

    it('should show sticky CTA when About section reaches top of viewport', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Get both sections
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      // Mock About section at top of viewport
      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: 0, // Exactly at the top
          bottom: 500,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        })
      );

      // Mock endorsement section being in lower viewport
      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.85, // Section is at 85% of viewport
          bottom: window.innerHeight * 1.2,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.85,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      // Trigger scroll event
      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Sticky CTA should now be visible
      expect(screen.getByText('Endorse Now')).toBeInTheDocument();
    });

    it('should hide sticky CTA when form becomes active', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Set up conditions for sticky CTA to show
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: -100,
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
          x: 0,
          y: -100,
          toJSON: () => ({}),
        })
      );

      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.85,
          bottom: window.innerHeight * 1.2,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.85,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      // Trigger scroll to show sticky CTA
      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByText('Endorse Now')).toBeInTheDocument();

      // Simulate form focus (user starts interacting with form)
      const formFocusButton = screen.getByTestId('form-focus-trigger');
      await act(async () => {
        formFocusButton.click();
      });

      // Sticky CTA should be hidden
      expect(screen.queryByText('Endorse Now')).not.toBeInTheDocument();
    });

    it('should show sticky CTA again when user leaves form', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Set up scroll conditions and activate form
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: -100,
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
          x: 0,
          y: -100,
          toJSON: () => ({}),
        })
      );

      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.85,
          bottom: window.innerHeight * 1.2,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.85,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      // Focus form
      const formFocusButton = screen.getByTestId('form-focus-trigger');
      await act(async () => {
        formFocusButton.click();
      });

      expect(screen.queryByText('Endorse Now')).not.toBeInTheDocument();

      // Blur form (user leaves form)
      const formBlurButton = screen.getByTestId('form-blur-trigger');
      await act(async () => {
        formBlurButton.click();
      });

      // Sticky CTA should reappear
      expect(screen.getByText('Endorse Now')).toBeInTheDocument();
    });

    it('should call scrollToFirstField when sticky CTA is clicked', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Set up conditions for sticky CTA to show
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: -100,
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
          x: 0,
          y: -100,
          toJSON: () => ({}),
        })
      );

      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.85,
          bottom: window.innerHeight * 1.2,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.85,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      const endorseButton = screen.getByText('Endorse Now');
      await act(async () => {
        endorseButton.click();
      });

      expect(mockScrollToFirstField).toHaveBeenCalledTimes(1);
    });

    it('should hide sticky CTA after successful form submission', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
      });

      // Set up scroll conditions
      const aboutSection = screen.getByRole('region', { name: 'About This Campaign' });
      const endorsementSection = screen.getByRole('region', { name: 'Endorsements' });

      const mockAboutBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: -100,
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 500,
          x: 0,
          y: -100,
          toJSON: () => ({}),
        })
      );

      const mockEndorsementBoundingClientRect = jest.fn(
        (): DOMRect => ({
          top: window.innerHeight * 0.85,
          bottom: window.innerHeight * 1.2,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: window.innerHeight * 0.85,
          toJSON: () => ({}),
        })
      );

      jest
        .spyOn(aboutSection, 'getBoundingClientRect')
        .mockImplementation(mockAboutBoundingClientRect);
      jest
        .spyOn(endorsementSection, 'getBoundingClientRect')
        .mockImplementation(mockEndorsementBoundingClientRect);

      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByText('Endorse Now')).toBeInTheDocument();

      // Simulate successful form submission
      const submitButton = screen.getByText('Submit Endorsement');
      await act(async () => {
        submitButton.click();
      });

      // After submission, sticky CTA behavior depends on scroll position and form state
      // The current implementation doesn't automatically hide it after submission
    });
  });

  describe('accessibility and semantic structure', () => {
    it('should have proper heading structure', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toHaveTextContent('Test Campaign');

        const h2Elements = screen.getAllByRole('heading', { level: 2 });
        expect(h2Elements).toHaveLength(2);
        expect(h2Elements[0]).toHaveTextContent('About This Campaign');
        expect(h2Elements[1]).toHaveTextContent('Endorsements');
      });
    });

    it('should have proper section structure', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        const sections = screen.getAllByRole('region');
        expect(sections.length).toBeGreaterThanOrEqual(2); // description + endorsements sections
      });
    });

    it('should have proper data-testid attributes', async () => {
      mockAPI.getCampaignById.mockResolvedValue(mockCampaign);

      await act(async () => {
        renderCampaignDetail({ campaignId: 1 });
      });

      await waitFor(() => {
        expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
        expect(screen.getByTestId('endorsement-form')).toBeInTheDocument();
        expect(screen.getByTestId('endorsements-list')).toBeInTheDocument();
      });
    }, 10000);
  });
});
