import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import API from "../services/api";
import analytics from "../services/analytics";
import { Campaign, EndorsementCreate, Stakeholder } from "../types/index";
import SocialShareButtons from "./SocialShareButtons";
import AddressAutocomplete from "./AddressAutocomplete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import "../styles/Endorsements.css";

interface EndorsementFormProps {
  campaign: Campaign;
  onEndorsementSubmitted?: () => void;
  onFormInteraction?: (isActive: boolean) => void;
}

export interface EndorsementFormRef {
  scrollToFirstField: () => void;
}

// Static data - defined outside component to avoid recreation on each render
const STATES: [string, string][] = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const EndorsementForm = forwardRef<EndorsementFormRef, EndorsementFormProps>(
  ({ campaign, onEndorsementSubmitted, onFormInteraction }, ref) => {
    const [stakeholder, setStakeholder] = useState<
      Omit<
        Stakeholder,
        "id" | "created_at" | "updated_at" | "type" | "name"
      > & {
        type: Stakeholder["type"] | "";
      }
    >({
      first_name: "",
      last_name: "",
      organization: "",
      role: "",
      email: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      type: "",
      email_updates: false,
    });

    const [statement, setStatement] = useState<string>("");
    const [publicDisplay, setPublicDisplay] = useState<boolean>(true);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const [orgAuthorized, setOrgAuthorized] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Spam prevention state
    const [formStartTime] = useState<string>(new Date().toISOString());
    const [honeypotFields, setHoneypotFields] = useState({
      website: "",
      url: "",
      homepage: "",
      confirm_email: "",
    });
    const formRef = useRef<HTMLFormElement>(null);
    const typeSelectRef = useRef<HTMLSelectElement>(null);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        scrollToFirstField: () => {
          if (typeSelectRef.current) {
            typeSelectRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            typeSelectRef.current.focus();
          }
        },
      }),
      []
    );

    // Handle form interaction events
    const handleFormFocus = () => {
      analytics.trackFormInteraction("endorsement_form", "form_focus");
      if (onFormInteraction) {
        onFormInteraction(true);
      }
    };

    const handleFormBlur = (e: React.FocusEvent) => {
      // Check if focus is moving to another element within the form
      if (
        formRef.current &&
        !formRef.current.contains(e.relatedTarget as Node)
      ) {
        // Focus is leaving the form entirely
        if (onFormInteraction) {
          onFormInteraction(false);
        }
      }
    };

    const handleStakeholderChange = (
      field: keyof typeof stakeholder,
      value: string
    ) => {
      setStakeholder((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Reset org authorization when organization is cleared
      if (field === "organization" && !value) {
        setOrgAuthorized(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const endorsementData: EndorsementCreate = {
          campaign_id: campaign.id,
          stakeholder: stakeholder as Omit<
            Stakeholder,
            "id" | "created_at" | "updated_at" | "name"
          >,
          statement,
          public_display: publicDisplay,
          terms_accepted: termsAccepted,
          org_authorized: orgAuthorized,
          form_metadata: {
            form_start_time: formStartTime,
            referrer: document.referrer || "",
            ...honeypotFields,
          },
        };

        await API.createEndorsement(endorsementData);
        setSuccess(true);

        // Track successful endorsement submission
        analytics.trackEndorsementSubmission(
          campaign.name || `Campaign ${campaign.id}`
        );

        // Hide sticky CTA since form was submitted successfully
        if (onFormInteraction) {
          onFormInteraction(false);
        }

        // Reset form
        setStakeholder({
          first_name: "",
          last_name: "",
          organization: "",
          role: "",
          email: "",
          street_address: "",
          city: "",
          state: "",
          zip_code: "",
          type: "",
          email_updates: false,
        });
        setStatement("");
        setPublicDisplay(true);
        setTermsAccepted(false);
        setOrgAuthorized(false);
        setHoneypotFields({
          website: "",
          url: "",
          homepage: "",
          confirm_email: "",
        });

        // Notify parent component
        if (onEndorsementSubmitted) {
          onEndorsementSubmitted();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to submit endorsement"
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const stakeholderTypes = [
      { value: "farmer", label: "Farmer" },
      { value: "waterman", label: "Waterman" },
      { value: "business", label: "Business" },
      { value: "nonprofit", label: "Nonprofit" },
      { value: "scientist", label: "Scientist" },
      { value: "healthcare", label: "Health care professional" },
      { value: "government", label: "Government official" },
      { value: "individual", label: "Individual" },
      { value: "other", label: "Other" },
    ];

    if (!campaign.allow_endorsements) {
      return (
        <div className="endorsement-form-disabled">
          <p>This campaign is not currently accepting endorsements.</p>
        </div>
      );
    }

    return (
      <div
        className="endorsement-form"
        data-testid="endorsement-form"
        id="endorse"
      >
        <h3>Endorse This Campaign</h3>

        {campaign.endorsement_statement && (
          <div className="endorsement-statement">
            <h4>
              By submitting this form, you agree to the following statement:
            </h4>
            <blockquote>
              &ldquo;{campaign.endorsement_statement}&rdquo;
            </blockquote>
          </div>
        )}

        {campaign.endorsement_form_instructions && (
          <div className="form-instructions">
            <div
              dangerouslySetInnerHTML={{
                __html: campaign.endorsement_form_instructions,
              }}
            />
          </div>
        )}

        {success && (
          <div className="success-message" data-testid="success-message">
            <h3>Thank you for your endorsement!</h3>
            <p>
              Your endorsement has been submitted successfully and will be
              reviewed shortly.
            </p>

            <div className="share-endorsement-section">
              <p className="share-cta">
                Help amplify your support by sharing this campaign:
              </p>
              <SocialShareButtons
                url={`${window.location.origin}/campaigns/${campaign.name}`}
                title={`I just endorsed ${campaign.title}!`}
                description={`Join me in supporting this important initiative: ${
                  campaign.summary || campaign.description
                }`}
                hashtags={[
                  "PolicyChange",
                  "CivicEngagement",
                  campaign.name?.replace(/-/g, "") || "",
                ]}
                campaignName={campaign.name}
                showLabel={false}
              />
            </div>
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
            style={{
              position: "absolute",
              left: "-9999px",
              opacity: 0,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <label htmlFor="website">Website (leave blank):</label>
            <input
              id="website"
              type="text"
              value={honeypotFields.website}
              onChange={(e) =>
                setHoneypotFields((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="url">URL (leave blank):</label>
            <input
              id="url"
              type="text"
              value={honeypotFields.url}
              onChange={(e) =>
                setHoneypotFields((prev) => ({ ...prev, url: e.target.value }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="homepage">Homepage (leave blank):</label>
            <input
              id="homepage"
              type="text"
              value={honeypotFields.homepage}
              onChange={(e) =>
                setHoneypotFields((prev) => ({
                  ...prev,
                  homepage: e.target.value,
                }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="confirm_email">Confirm Email (leave blank):</label>
            <input
              id="confirm_email"
              type="text"
              value={honeypotFields.confirm_email}
              onChange={(e) =>
                setHoneypotFields((prev) => ({
                  ...prev,
                  confirm_email: e.target.value,
                }))
              }
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Endorser type *</label>
            <select
              id="type"
              ref={typeSelectRef}
              value={stakeholder.type}
              onChange={(e) =>
                handleStakeholderChange(
                  "type",
                  e.target.value as Stakeholder["type"]
                )
              }
              required
              data-testid="type-select"
              aria-describedby="type-help"
            >
              <option value="" disabled>
                Select endorser type
              </option>
              {stakeholderTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span id="type-help" className="label-helper">
              Choose the category that best describes you or your organization
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="first-name">First Name *</label>
            <input
              id="first-name"
              type="text"
              value={stakeholder.first_name}
              onChange={(e) =>
                handleStakeholderChange("first_name", e.target.value)
              }
              required
              data-testid="first-name-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last-name">Last Name *</label>
            <input
              id="last-name"
              type="text"
              value={stakeholder.last_name}
              onChange={(e) =>
                handleStakeholderChange("last_name", e.target.value)
              }
              required
              data-testid="last-name-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization">Organization</label>
            <input
              id="organization"
              type="text"
              value={stakeholder.organization}
              onChange={(e) =>
                handleStakeholderChange("organization", e.target.value)
              }
              data-testid="organization-input"
            />
          </div>

          {stakeholder.organization && (
            <div className="form-group">
              <fieldset>
                <legend className="form-label">How are you endorsing? *</legend>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="endorsement-type"
                      value="behalf"
                      checked={orgAuthorized === true}
                      onChange={() => setOrgAuthorized(true)}
                      required
                      data-testid="org-behalf-radio"
                    />
                    I am endorsing on behalf of this organization and am
                    authorized to do so
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="endorsement-type"
                      value="individual"
                      checked={orgAuthorized === false}
                      onChange={() => setOrgAuthorized(false)}
                      required
                      data-testid="org-individual-radio"
                    />
                    I am endorsing as an individual (affiliated with this
                    organization but not endorsing on their behalf)
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="role">Role/Title</label>
            <input
              id="role"
              type="text"
              value={stakeholder.role}
              onChange={(e) => handleStakeholderChange("role", e.target.value)}
              data-testid="role-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={stakeholder.email}
              onChange={(e) => handleStakeholderChange("email", e.target.value)}
              required
              data-testid="email-input"
            />
          </div>

          <div className="address-info-message">
            <h4 className="address-info-title">Why do we need your address?</h4>
            <p>
              We use your address to identify your legislative districts
              (Congressional, State Senate, and State House). This helps your
              representatives understand constituent support by district. Your
              personal information will never be shared with other
              organizations.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="address-autocomplete">Address *</label>
            <AddressAutocomplete
              onAddressSelect={(components) => {
                setStakeholder((prev) => ({
                  ...prev,
                  street_address: components.street_address,
                  city: components.city,
                  state: components.state,
                  zip_code: components.zip_code,
                }));
              }}
              placeholder="Start typing your address..."
              required={true}
              testId="address-autocomplete"
            />
            <small className="form-help-text">
              Start typing your address and select from the suggestions
            </small>
          </div>

          {/* Show the populated address fields (editable) after selection */}
          {stakeholder.street_address && (
            <>
              <div className="form-group">
                <label htmlFor="street-address">Street Address</label>
                <input
                  id="street-address"
                  type="text"
                  value={stakeholder.street_address}
                  onChange={(e) =>
                    handleStakeholderChange("street_address", e.target.value)
                  }
                  required
                  data-testid="street-address-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={stakeholder.city}
                  onChange={(e) =>
                    handleStakeholderChange("city", e.target.value)
                  }
                  required
                  data-testid="city-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  value={stakeholder.state}
                  onChange={(e) =>
                    handleStakeholderChange("state", e.target.value)
                  }
                  required
                  data-testid="state-select"
                >
                  <option value="">Select a state</option>
                  {STATES.map(([abbr, name]) => (
                    <option key={abbr} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="zip-code">ZIP Code</label>
                <input
                  id="zip-code"
                  type="text"
                  value={stakeholder.zip_code}
                  onChange={(e) =>
                    handleStakeholderChange("zip_code", e.target.value)
                  }
                  required
                  pattern="[0-9]{5}(-[0-9]{4})?"
                  title="Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"
                  data-testid="zip-code-input"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="statement">
              Your Voice Matters - Share Your Story
              <span className="label-helper">
                Help us advocate for this policy by sharing why it matters to
                you. Your story helps us demonstrate real constituent support
                when we speak with legislators.
              </span>
            </label>
            <textarea
              id="statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={6}
              placeholder="Tell us why you support this campaign — your personal story, how this policy would impact you or your community, or what change you hope to see (optional)"
              data-testid="statement-textarea"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={publicDisplay}
                onChange={(e) => setPublicDisplay(e.target.checked)}
                data-testid="public-display-checkbox"
              />
              I consent to potentially having my endorsement displayed publicly
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={stakeholder.email_updates || false}
                onChange={(e) =>
                  setStakeholder((prev) => ({
                    ...prev,
                    email_updates: e.target.checked,
                  }))
                }
                data-testid="email-updates-checkbox"
              />
              I would like to receive email updates about future policy
              endorsement opportunities
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                aria-required="true"
                data-testid="terms-checkbox"
              />
              I agree to the&nbsp;
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
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    style={{
                      fontSize: "1.2em",
                      marginRight: "0.5rem",
                      flexShrink: 0,
                    }}
                  />
                  <span>Submit Endorsement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

EndorsementForm.displayName = "EndorsementForm";

export default EndorsementForm;
