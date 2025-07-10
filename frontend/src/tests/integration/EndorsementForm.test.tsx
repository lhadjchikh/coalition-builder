import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EndorsementForm from '../../components/EndorsementForm';
import { Campaign } from '../../types';
import API from '../../services/api';
import { withSuppressedErrors } from '../utils/testUtils';

// Mock the API
jest.mock('../../services/api');
const mockAPI = API as jest.Mocked<typeof API>;

describe('EndorsementForm', () => {
  const mockCampaign: Campaign = {
    id: 1,
    name: 'test-campaign',
    title: 'Test Campaign',
    summary: 'A test campaign for endorsements',
    description: 'Test description',
    endorsement_statement: 'I support this test campaign',
    allow_endorsements: true,
    endorsement_form_instructions: 'Please fill out all fields',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
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
        form_metadata: expect.objectContaining({
          form_start_time: expect.any(String),
          website: '',
          url: '',
          homepage: '',
          confirm_email: '',
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    expect(onEndorsementSubmitted).toHaveBeenCalled();
  });

  it('shows error message when submission fails', async () => {
    await withSuppressedErrors(['Submission failed'], async () => {
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

  it('prevents submission when honeypot fields are filled (bot detection)', async () => {
    await withSuppressedErrors(['spam detection'], async () => {
      // Mock API to simulate honeypot detection rejection
      mockAPI.createEndorsement.mockRejectedValue(
        new Error('Submission rejected due to spam detection')
      );

      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill out required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Bot User' } });
      fireEvent.change(screen.getByTestId('organization-input'), { target: { value: 'Bot Org' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'bot@spam.com' } });
      fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'CA' } });

      // Fill honeypot fields (this simulates bot behavior)
      const websiteField = screen.getByLabelText(/website.*leave blank/i);
      const urlField = screen.getByLabelText(/url.*leave blank/i);
      fireEvent.change(websiteField, { target: { value: 'http://spam.com' } });
      fireEvent.change(urlField, { target: { value: 'http://malicious.com' } });

      // Submit the form
      fireEvent.click(screen.getByTestId('submit-button'));

      // Verify that API was called with honeypot fields filled
      await waitFor(() => {
        expect(mockAPI.createEndorsement).toHaveBeenCalledWith(
          expect.objectContaining({
            form_metadata: expect.objectContaining({
              website: 'http://spam.com',
              url: 'http://malicious.com',
            }),
          })
        );
      });

      // Verify that submission was rejected (spam detection)
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent(/spam detection/i);
      });

      // Verify success callback was not called
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });
  });
});
