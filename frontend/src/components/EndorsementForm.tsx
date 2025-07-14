import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import API from '../services/api';
import { Campaign, EndorsementCreate, Stakeholder } from '../types';
import './Endorsements.css';

interface EndorsementFormProps {
  campaign: Campaign;
  onEndorsementSubmitted?: () => void;
  onFormInteraction?: (isActive: boolean) => void;
}

export interface EndorsementFormRef {
  scrollToFirstField: () => void;
}

const EndorsementForm = forwardRef<EndorsementFormRef, EndorsementFormProps>(
  ({ campaign, onEndorsementSubmitted, onFormInteraction }, ref) => {
    const [stakeholder, setStakeholder] = useState<
      Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>
    >({
      name: '',
      organization: '',
      role: '',
      email: '',
      state: '',
      county: '',
      type: 'individual',
    });

    const [statement, setStatement] = useState<string>('');
    const [publicDisplay, setPublicDisplay] = useState<boolean>(true);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Spam prevention state
    const [formStartTime] = useState<string>(new Date().toISOString());
    const [honeypotFields, setHoneypotFields] = useState({
      website: '',
      url: '',
      homepage: '',
      confirm_email: '',
    });
    const formRef = useRef<HTMLFormElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        scrollToFirstField: () => {
          if (nameInputRef.current) {
            nameInputRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            nameInputRef.current.focus();
          }
        },
      }),
      []
    );

    // Handle form interaction events
    const handleFormFocus = () => {
      if (onFormInteraction) {
        onFormInteraction(true);
      }
    };

    const handleFormBlur = (e: React.FocusEvent) => {
      // Check if focus is moving to another element within the form
      if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
        // Focus is leaving the form entirely
        if (onFormInteraction) {
          onFormInteraction(false);
        }
      }
    };

    const handleStakeholderChange = (field: keyof typeof stakeholder, value: string) => {
      setStakeholder(prev => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const endorsementData: EndorsementCreate = {
          campaign_id: campaign.id,
          stakeholder,
          statement,
          public_display: publicDisplay,
          terms_accepted: termsAccepted,
          form_metadata: {
            form_start_time: formStartTime,
            referrer: document.referrer || '',
            ...honeypotFields,
          },
        };

        await API.createEndorsement(endorsementData);
        setSuccess(true);

        // Hide sticky CTA since form was submitted successfully
        if (onFormInteraction) {
          onFormInteraction(false);
        }

        // Reset form
        setStakeholder({
          name: '',
          organization: '',
          role: '',
          email: '',
          state: '',
          county: '',
          type: 'individual',
        });
        setStatement('');
        setPublicDisplay(true);
        setTermsAccepted(false);
        setHoneypotFields({
          website: '',
          url: '',
          homepage: '',
          confirm_email: '',
        });

        // Notify parent component
        if (onEndorsementSubmitted) {
          onEndorsementSubmitted();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit endorsement');
      } finally {
        setIsSubmitting(false);
      }
    };

    const stakeholderTypes = [
      { value: 'farmer', label: 'Farmer' },
      { value: 'waterman', label: 'Waterman' },
      { value: 'business', label: 'Business' },
      { value: 'nonprofit', label: 'Nonprofit' },
      { value: 'individual', label: 'Individual' },
      { value: 'government', label: 'Government' },
      { value: 'other', label: 'Other' },
    ];

    const stateAbbreviations = [
      'AL',
      'AK',
      'AZ',
      'AR',
      'CA',
      'CO',
      'CT',
      'DE',
      'FL',
      'GA',
      'HI',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'LA',
      'ME',
      'MD',
      'MA',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NV',
      'NH',
      'NJ',
      'NM',
      'NY',
      'NC',
      'ND',
      'OH',
      'OK',
      'OR',
      'PA',
      'RI',
      'SC',
      'SD',
      'TN',
      'TX',
      'UT',
      'VT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
    ];

    if (!campaign.allow_endorsements) {
      return (
        <div className="endorsement-form-disabled">
          <p>This campaign is not currently accepting endorsements.</p>
        </div>
      );
    }

    return (
      <div className="endorsement-form" data-testid="endorsement-form">
        <h3>Endorse This Campaign</h3>

        {campaign.endorsement_statement && (
          <div className="endorsement-statement">
            <h4>By submitting this form, you agree to the following statement:</h4>
            <blockquote>"{campaign.endorsement_statement}"</blockquote>
          </div>
        )}

        {campaign.endorsement_form_instructions && (
          <div className="form-instructions">
            <p>{campaign.endorsement_form_instructions}</p>
          </div>
        )}

        {success && (
          <div className="success-message" data-testid="success-message">
            <p>Thank you! Your endorsement has been submitted successfully.</p>
          </div>
        )}

        {error && (
          <div className="error-message" data-testid="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          onFocus={handleFormFocus}
          onBlur={handleFormBlur}
        >
          {/* Honeypot fields - hidden from users but visible to bots */}
          <div
            style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <label htmlFor="website">Website (leave blank):</label>
            <input
              id="website"
              type="text"
              value={honeypotFields.website}
              onChange={e => setHoneypotFields(prev => ({ ...prev, website: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="url">URL (leave blank):</label>
            <input
              id="url"
              type="text"
              value={honeypotFields.url}
              onChange={e => setHoneypotFields(prev => ({ ...prev, url: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="homepage">Homepage (leave blank):</label>
            <input
              id="homepage"
              type="text"
              value={honeypotFields.homepage}
              onChange={e => setHoneypotFields(prev => ({ ...prev, homepage: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="confirm_email">Confirm Email (leave blank):</label>
            <input
              id="confirm_email"
              type="text"
              value={honeypotFields.confirm_email}
              onChange={e =>
                setHoneypotFields(prev => ({ ...prev, confirm_email: e.target.value }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={stakeholder.name}
              onChange={e => handleStakeholderChange('name', e.target.value)}
              required
              data-testid="name-input"
              ref={nameInputRef}
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">Organization *</label>
            <input
              id="organization"
              type="text"
              value={stakeholder.organization}
              onChange={e => handleStakeholderChange('organization', e.target.value)}
              required
              data-testid="organization-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role/Title</label>
            <input
              id="role"
              type="text"
              value={stakeholder.role}
              onChange={e => handleStakeholderChange('role', e.target.value)}
              data-testid="role-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={stakeholder.email}
              onChange={e => handleStakeholderChange('email', e.target.value)}
              required
              data-testid="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State *</label>
            <select
              id="state"
              value={stakeholder.state}
              onChange={e => handleStakeholderChange('state', e.target.value)}
              required
              data-testid="state-select"
            >
              <option value="">Select a state</option>
              {stateAbbreviations.map(state => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="county">County</label>
            <input
              id="county"
              type="text"
              value={stakeholder.county}
              onChange={e => handleStakeholderChange('county', e.target.value)}
              data-testid="county-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={stakeholder.type}
              onChange={e => handleStakeholderChange('type', e.target.value as Stakeholder['type'])}
              required
              data-testid="type-select"
            >
              {stakeholderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="statement">Additional Comments</label>
            <textarea
              id="statement"
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={4}
              placeholder="Share why you support this campaign (optional)"
              data-testid="statement-textarea"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={publicDisplay}
                onChange={e => setPublicDisplay(e.target.checked)}
                data-testid="public-display-checkbox"
              />
              Display my endorsement publicly
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                required
                aria-required="true"
                data-testid="terms-checkbox"
              />
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Use
              </a>
              <span aria-hidden="true">*</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-button"
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Endorsement'}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

EndorsementForm.displayName = 'EndorsementForm';

export default EndorsementForm;
