import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EndorsementForm from '../../components/EndorsementForm';
import { Campaign } from '../../types';
import API from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

describe('EndorsementForm', () => {
  const mockCampaign: Campaign = {
    id: 1,
    title: 'Test Campaign',
    slug: 'test-campaign',
    summary: 'A test campaign for endorsements',
    description: 'Test description',
    endorsement_statement: 'I support this test campaign',
    allow_endorsements: true,
    endorsement_form_instructions: 'Please fill out all fields',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the endorsement form with all fields', () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    expect(screen.getByText('Endorse This Campaign')).toBeInTheDocument();
    expect(screen.getByText('"I support this test campaign"')).toBeInTheDocument();
    expect(screen.getByText('Please fill out all fields')).toBeInTheDocument();

    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('organization-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('state-select')).toBeInTheDocument();
    expect(screen.getByTestId('type-select')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('does not render form when endorsements are not allowed', () => {
    const campaignWithoutEndorsements = {
      ...mockCampaign,
      allow_endorsements: false,
    };

    render(<EndorsementForm campaign={campaignWithoutEndorsements} />);

    expect(
      screen.getByText('This campaign is not currently accepting endorsements.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('name-input')).not.toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockEndorsement = {
      id: 1,
      stakeholder: {
        id: 1,
        name: 'John Doe',
        organization: 'Test Org',
        role: 'Manager',
        email: 'john@test.com',
        state: 'MD',
        county: 'Test County',
        type: 'business' as const,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      campaign: mockCampaign,
      statement: 'Great campaign!',
      public_display: true,
      created_at: '2024-01-01',
    };

    mockAPI.createEndorsement.mockResolvedValue(mockEndorsement);

    const onEndorsementSubmitted = jest.fn();
    render(
      <EndorsementForm campaign={mockCampaign} onEndorsementSubmitted={onEndorsementSubmitted} />
    );

    // Fill out the form
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('organization-input'), { target: { value: 'Test Org' } });
    fireEvent.change(screen.getByTestId('role-input'), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'MD' } });
    fireEvent.change(screen.getByTestId('county-input'), { target: { value: 'Test County' } });
    fireEvent.change(screen.getByTestId('type-select'), { target: { value: 'business' } });
    fireEvent.change(screen.getByTestId('statement-textarea'), {
      target: { value: 'Great campaign!' },
    });

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockAPI.createEndorsement).toHaveBeenCalledWith({
        campaign_id: 1,
        stakeholder: {
          name: 'John Doe',
          organization: 'Test Org',
          role: 'Manager',
          email: 'john@test.com',
          state: 'MD',
          county: 'Test County',
          type: 'business',
        },
        statement: 'Great campaign!',
        public_display: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    expect(onEndorsementSubmitted).toHaveBeenCalled();
  });

  it('shows error message when submission fails', async () => {
    mockAPI.createEndorsement.mockRejectedValue(new Error('Submission failed'));

    render(<EndorsementForm campaign={mockCampaign} />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('organization-input'), { target: { value: 'Test Org' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'MD' } });

    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Error: Submission failed')).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    const nameInput = screen.getByTestId('name-input');
    const organizationInput = screen.getByTestId('organization-input');
    const emailInput = screen.getByTestId('email-input');
    const stateSelect = screen.getByTestId('state-select');

    expect(nameInput).toBeRequired();
    expect(organizationInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(stateSelect).toBeRequired();
  });
});
