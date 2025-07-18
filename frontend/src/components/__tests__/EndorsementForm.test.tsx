import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EndorsementForm from '../EndorsementForm';
import { Campaign } from '../../types';

describe('EndorsementForm', () => {
  const mockCampaign: Campaign = {
    id: 1,
    name: 'test-campaign',
    title: 'Test Campaign',
    summary: 'Test Summary',
    description: 'Test Description',
    allow_endorsements: true,
    created_at: '2024-01-01',
  };

  it('handles honeypot field changes', () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    // Test homepage honeypot field
    const homepageField = screen.getByLabelText(/homepage.*leave blank/i);
    fireEvent.change(homepageField, { target: { value: 'spam-value' } });
    expect(homepageField).toHaveValue('spam-value');

    // Test confirm_email honeypot field
    const confirmEmailField = screen.getByLabelText(/confirm email.*leave blank/i);
    fireEvent.change(confirmEmailField, { target: { value: 'spam@test.com' } });
    expect(confirmEmailField).toHaveValue('spam@test.com');
  });

  it('handles public display checkbox change', () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    const publicDisplayCheckbox = screen.getByTestId('public-display-checkbox');

    // Should be checked by default
    expect(publicDisplayCheckbox).toBeChecked();

    // Uncheck it
    fireEvent.click(publicDisplayCheckbox);
    expect(publicDisplayCheckbox).not.toBeChecked();

    // Check it again
    fireEvent.click(publicDisplayCheckbox);
    expect(publicDisplayCheckbox).toBeChecked();
  });
});
