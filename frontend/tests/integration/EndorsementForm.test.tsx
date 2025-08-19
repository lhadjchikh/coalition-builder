import React, { useRef } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EndorsementForm, {
  EndorsementFormRef,
} from "../../components/EndorsementForm";
import { Campaign } from "../../types/index";
import API from "../../services/api-client";
import { withSuppressedErrors } from "../utils/testUtils";

// Mock the API
jest.mock("../../services/api-client");
const mockAPI = API as jest.Mocked<typeof API>;

describe("EndorsementForm", () => {
  const mockCampaign: Campaign = {
    id: 1,
    name: "test-campaign",
    title: "Test Campaign",
    summary: "A test campaign for endorsements",
    description: "Test description",
    endorsement_statement: "I support this test campaign",
    allow_endorsements: true,
    endorsement_form_instructions: "Please fill out all fields",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the endorsement form with all fields", () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    expect(screen.getByText("Endorse This Campaign")).toBeInTheDocument();
    expect(
      screen.getByText('"I support this test campaign"')
    ).toBeInTheDocument();
    expect(screen.getByText("Please fill out all fields")).toBeInTheDocument();

    expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("last-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("organization-input")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("street-address-input")).toBeInTheDocument();
    expect(screen.getByTestId("city-input")).toBeInTheDocument();
    expect(screen.getByTestId("state-select")).toBeInTheDocument();
    expect(screen.getByTestId("zip-code-input")).toBeInTheDocument();
    expect(screen.getByTestId("type-select")).toBeInTheDocument();
    expect(screen.getByTestId("email-updates-checkbox")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();

    // Check for the address info message
    expect(
      screen.getByText(
        /We use your address to identify your legislative districts/
      )
    ).toBeInTheDocument();
  });

  it("does not render form when endorsements are not allowed", () => {
    const campaignWithoutEndorsements = {
      ...mockCampaign,
      allow_endorsements: false,
    };

    render(<EndorsementForm campaign={campaignWithoutEndorsements} />);

    expect(
      screen.getByText("This campaign is not currently accepting endorsements.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("first-name-input")).not.toBeInTheDocument();
    expect(screen.queryByTestId("last-name-input")).not.toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const mockEndorsement = {
      id: 1,
      stakeholder: {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        organization: "Test Org",
        role: "Manager",
        email: "john@test.com",
        street_address: "123 Main St",
        city: "Baltimore",
        state: "MD",
        zip_code: "21201",
        type: "business" as const,
        email_updates: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
      campaign: mockCampaign,
      statement: "Great campaign!",
      public_display: true,
      created_at: "2024-01-01",
    };

    mockAPI.createEndorsement.mockResolvedValue(mockEndorsement);

    const onEndorsementSubmitted = jest.fn();
    render(
      <EndorsementForm
        campaign={mockCampaign}
        onEndorsementSubmitted={onEndorsementSubmitted}
      />
    );

    // Fill out the form
    fireEvent.change(screen.getByTestId("type-select"), {
      target: { value: "business" },
    });
    fireEvent.change(screen.getByTestId("first-name-input"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByTestId("last-name-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("organization-input"), {
      target: { value: "Test Org" },
    });
    fireEvent.change(screen.getByTestId("role-input"), {
      target: { value: "Manager" },
    });
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByTestId("street-address-input"), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByTestId("city-input"), {
      target: { value: "Baltimore" },
    });
    fireEvent.change(screen.getByTestId("state-select"), {
      target: { value: "Maryland" },
    });
    fireEvent.change(screen.getByTestId("zip-code-input"), {
      target: { value: "21201" },
    });
    fireEvent.change(screen.getByTestId("statement-textarea"), {
      target: { value: "Great campaign!" },
    });

    // Check email updates checkbox
    fireEvent.click(screen.getByTestId("email-updates-checkbox"));

    // Select organization authorization (since we provided an organization)
    fireEvent.click(screen.getByTestId("org-behalf-radio"));

    // Accept terms (required)
    fireEvent.click(screen.getByTestId("terms-checkbox"));

    // Submit the form
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockAPI.createEndorsement).toHaveBeenCalledWith({
        campaign_id: 1,
        stakeholder: {
          first_name: "John",
          last_name: "Doe",
          organization: "Test Org",
          role: "Manager",
          email: "john@test.com",
          street_address: "123 Main St",
          city: "Baltimore",
          state: "MD",
          zip_code: "21201",
          type: "business",
          email_updates: true,
        },
        statement: "Great campaign!",
        public_display: true,
        terms_accepted: true,
        org_authorized: true,
        form_metadata: expect.objectContaining({
          form_start_time: expect.any(String),
          website: "",
          url: "",
          homepage: "",
          confirm_email: "",
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toBeInTheDocument();
    });
    expect(onEndorsementSubmitted).toHaveBeenCalled();
  });

  it("shows error message when submission fails", async () => {
    await withSuppressedErrors(["Submission failed"], async () => {
      mockAPI.createEndorsement.mockRejectedValue(
        new Error("Submission failed")
      );

      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill out required fields
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Org" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@test.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Baltimore" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "MD" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "21201" },
      });

      // Accept terms (required)
      fireEvent.click(screen.getByTestId("terms-checkbox"));

      // Submit the form
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
      });
      expect(screen.getByText("Error: Submission failed")).toBeInTheDocument();
    });
  });

  it("renders HTML in form instructions", () => {
    const campaignWithHTMLInstructions = {
      ...mockCampaign,
      endorsement_form_instructions:
        "Please <strong>fill out all fields</strong> and <em>submit carefully</em>.",
    };

    render(<EndorsementForm campaign={campaignWithHTMLInstructions} />);

    // Check that the form-instructions div exists
    const formInstructionsDiv = document.querySelector(".form-instructions");
    expect(formInstructionsDiv).toBeInTheDocument();

    // Verify the HTML elements are rendered within the form instructions
    const strongElement = formInstructionsDiv?.querySelector("strong");
    const emElement = formInstructionsDiv?.querySelector("em");

    expect(strongElement).toBeInTheDocument();
    expect(strongElement).toHaveTextContent("fill out all fields");

    expect(emElement).toBeInTheDocument();
    expect(emElement).toHaveTextContent("submit carefully");

    // Verify that the HTML is not rendered as plain text
    expect(formInstructionsDiv).not.toHaveTextContent("<strong>");
    expect(formInstructionsDiv).not.toHaveTextContent("</strong>");
    expect(formInstructionsDiv).not.toHaveTextContent("<em>");
    expect(formInstructionsDiv).not.toHaveTextContent("</em>");
  });

  it("validates required fields", () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    const firstNameInput = screen.getByTestId("first-name-input");
    const lastNameInput = screen.getByTestId("last-name-input");
    const organizationInput = screen.getByTestId("organization-input");
    const emailInput = screen.getByTestId("email-input");
    const streetAddressInput = screen.getByTestId("street-address-input");
    const cityInput = screen.getByTestId("city-input");
    const stateSelect = screen.getByTestId("state-select");
    const zipCodeInput = screen.getByTestId("zip-code-input");

    expect(firstNameInput).toBeRequired();
    expect(lastNameInput).toBeRequired();
    expect(organizationInput).not.toBeRequired(); // Organization is optional
    expect(emailInput).toBeRequired();
    expect(streetAddressInput).toBeRequired();
    expect(cityInput).toBeRequired();
    expect(stateSelect).toBeRequired();
    expect(zipCodeInput).toBeRequired();
  });

  it("validates ZIP code format", () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    const zipCodeInput = screen.getByTestId("zip-code-input");

    // Check that the pattern attribute is set correctly
    expect(zipCodeInput).toHaveAttribute("pattern", "[0-9]{5}(-[0-9]{4})?");
    expect(zipCodeInput).toHaveAttribute(
      "title",
      "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"
    );

    // Test that the input accepts valid ZIP codes
    fireEvent.change(zipCodeInput, { target: { value: "12345" } });
    expect(zipCodeInput).toHaveValue("12345");

    fireEvent.change(zipCodeInput, { target: { value: "12345-6789" } });
    expect(zipCodeInput).toHaveValue("12345-6789");

    // Test that the input accepts invalid format (HTML5 validation will handle this)
    fireEvent.change(zipCodeInput, { target: { value: "invalid" } });
    expect(zipCodeInput).toHaveValue("invalid");

    // The actual validation happens at form submission by the browser
    // We can test that the pattern is present for browser validation
    expect((zipCodeInput as HTMLInputElement).validity.patternMismatch).toBe(
      true
    );
  });

  it("prevents submission when honeypot fields are filled (bot detection)", async () => {
    await withSuppressedErrors(["spam detection"], async () => {
      // Mock API to simulate honeypot detection rejection
      mockAPI.createEndorsement.mockRejectedValue(
        new Error("Submission rejected due to spam detection")
      );

      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill out required fields
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "Bot" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "User" },
      });
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Bot Org" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "bot@spam.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Bot St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Bot City" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "CA" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "90001" },
      });

      // Fill honeypot fields (this simulates bot behavior)
      const websiteField = screen.getByLabelText(/website.*leave blank/i);
      const urlField = screen.getByLabelText(/url.*leave blank/i);
      fireEvent.change(websiteField, { target: { value: "http://spam.com" } });
      fireEvent.change(urlField, { target: { value: "http://malicious.com" } });

      // Accept terms (required)
      fireEvent.click(screen.getByTestId("terms-checkbox"));

      // Submit the form
      fireEvent.click(screen.getByTestId("submit-button"));

      // Verify that API was called with honeypot fields filled
      await waitFor(() => {
        expect(mockAPI.createEndorsement).toHaveBeenCalledWith(
          expect.objectContaining({
            form_metadata: expect.objectContaining({
              website: "http://spam.com",
              url: "http://malicious.com",
            }),
          })
        );
      });

      // Verify that submission was rejected (spam detection)
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          /spam detection/i
        );
      });

      // Verify success callback was not called
      expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();
    });
  });

  describe("ref functionality and form interaction", () => {
    // Helper component to test ref functionality
    const TestRefComponent = ({
      onFormInteraction,
      onScrollToField,
    }: {
      onFormInteraction?: jest.Mock;
      onScrollToField?: jest.Mock;
    }) => {
      const formRef = useRef<EndorsementFormRef>(null);

      const handleScrollToField = () => {
        formRef.current?.scrollToFirstField();
        onScrollToField?.();
      };

      return (
        <div>
          <button onClick={handleScrollToField} data-testid="scroll-trigger">
            Scroll to Field
          </button>
          <EndorsementForm
            ref={formRef}
            campaign={mockCampaign}
            onFormInteraction={onFormInteraction}
          />
        </div>
      );
    };

    beforeEach(() => {
      // Mock scrollIntoView and focus methods
      Element.prototype.scrollIntoView = jest.fn();
      HTMLElement.prototype.focus = jest.fn();
    });

    it("should expose scrollToFirstField method through ref", () => {
      const mockOnScrollToField = jest.fn();
      render(<TestRefComponent onScrollToField={mockOnScrollToField} />);

      const scrollButton = screen.getByTestId("scroll-trigger");
      fireEvent.click(scrollButton);

      expect(mockOnScrollToField).toHaveBeenCalledTimes(1);
    });

    it("should scroll to and focus the type select field when scrollToFirstField is called", () => {
      const mockScrollIntoView = jest.fn();
      const mockFocus = jest.fn();

      render(<TestRefComponent />);

      // Mock the type select specifically after render
      const typeSelect = screen.getByTestId("type-select");
      typeSelect.scrollIntoView = mockScrollIntoView;
      typeSelect.focus = mockFocus;

      const scrollButton = screen.getByTestId("scroll-trigger");
      fireEvent.click(scrollButton);

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(mockFocus).toHaveBeenCalledTimes(1);
    });

    it("should call onFormInteraction with true when form gains focus", () => {
      const mockOnFormInteraction = jest.fn();
      render(<TestRefComponent onFormInteraction={mockOnFormInteraction} />);

      const firstNameInput = screen.getByTestId("first-name-input");

      // Simulate form focus
      fireEvent.focus(firstNameInput);

      expect(mockOnFormInteraction).toHaveBeenCalledWith(true);
    });

    it("should call onFormInteraction with false when form loses focus", () => {
      const mockOnFormInteraction = jest.fn();
      render(<TestRefComponent onFormInteraction={mockOnFormInteraction} />);

      const firstNameInput = screen.getByTestId("first-name-input");

      // First focus the form
      fireEvent.focus(firstNameInput);
      expect(mockOnFormInteraction).toHaveBeenCalledWith(true);

      // Then blur the form (focus moves completely outside)
      fireEvent.blur(firstNameInput, { relatedTarget: null });

      expect(mockOnFormInteraction).toHaveBeenCalledWith(false);
    });

    it("should not call onFormInteraction with false when focus moves to another field within form", () => {
      const mockOnFormInteraction = jest.fn();
      render(<TestRefComponent onFormInteraction={mockOnFormInteraction} />);

      const firstNameInput = screen.getByTestId("first-name-input");
      const organizationInput = screen.getByTestId("organization-input");

      // Focus the name field
      fireEvent.focus(firstNameInput);
      expect(mockOnFormInteraction).toHaveBeenCalledWith(true);

      mockOnFormInteraction.mockClear();

      // Move focus to organization field (within the same form)
      fireEvent.blur(firstNameInput, { relatedTarget: organizationInput });

      // Should not call onFormInteraction(false) since focus stayed within form
      expect(mockOnFormInteraction).not.toHaveBeenCalledWith(false);
    });

    it("should call onFormInteraction with false after successful submission", async () => {
      mockAPI.createEndorsement.mockResolvedValue({} as any);
      const mockOnFormInteraction = jest.fn();

      render(<TestRefComponent onFormInteraction={mockOnFormInteraction} />);

      // Fill out all required form fields
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Org" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@test.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Richmond" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "VA" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "23219" },
      });
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });

      // Accept terms (required)
      fireEvent.click(screen.getByTestId("terms-checkbox"));

      // Submit the form
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(
        () => {
          expect(screen.getByTestId("success-message")).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should call onFormInteraction(false) after successful submission
      expect(mockOnFormInteraction).toHaveBeenCalledWith(false);
    }, 15000);

    it("should work correctly when onFormInteraction is not provided", () => {
      // This test ensures the component doesn't crash when callback is undefined
      render(<EndorsementForm campaign={mockCampaign} />);

      const firstNameInput = screen.getByTestId("first-name-input");
      const lastNameInput = screen.getByTestId("last-name-input");

      // These should not throw errors
      fireEvent.focus(firstNameInput);
      fireEvent.blur(firstNameInput);

      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
    });

    it("should maintain form functionality when ref is not provided", () => {
      // Test that form works normally without ref
      render(<EndorsementForm campaign={mockCampaign} />);

      expect(screen.getByTestId("first-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("last-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("organization-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });
  });

  describe("organization endorsement type", () => {
    it("should show radio buttons when organization is filled", () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Initially, no radio buttons should be visible
      expect(screen.queryByTestId("org-behalf-radio")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("org-individual-radio")
      ).not.toBeInTheDocument();

      // Fill in organization
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Company" },
      });

      // Radio buttons should appear
      expect(screen.getByTestId("org-behalf-radio")).toBeInTheDocument();
      expect(screen.getByTestId("org-individual-radio")).toBeInTheDocument();

      // Check the text content
      expect(
        screen.getByText(/I am endorsing on behalf of this organization/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /I am endorsing as an individual.*affiliated with this organization/
        )
      ).toBeInTheDocument();
    });

    it("should hide radio buttons when organization is cleared", () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill in organization
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Company" },
      });

      // Radio buttons should appear
      expect(screen.getByTestId("org-behalf-radio")).toBeInTheDocument();

      // Clear organization
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "" },
      });

      // Radio buttons should disappear
      expect(screen.queryByTestId("org-behalf-radio")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("org-individual-radio")
      ).not.toBeInTheDocument();
    });

    it("should default to individual endorsement when organization is present", () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill in organization
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Company" },
      });

      // Individual radio should be checked by default
      const individualRadio = screen.getByTestId(
        "org-individual-radio"
      ) as HTMLInputElement;
      const behalfRadio = screen.getByTestId(
        "org-behalf-radio"
      ) as HTMLInputElement;

      expect(individualRadio.checked).toBe(true);
      expect(behalfRadio.checked).toBe(false);
    });

    it("should allow switching between endorsement types", () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill in organization
      fireEvent.change(screen.getByTestId("organization-input"), {
        target: { value: "Test Company" },
      });

      const individualRadio = screen.getByTestId(
        "org-individual-radio"
      ) as HTMLInputElement;
      const behalfRadio = screen.getByTestId(
        "org-behalf-radio"
      ) as HTMLInputElement;

      // Initially individual is selected
      expect(individualRadio.checked).toBe(true);
      expect(behalfRadio.checked).toBe(false);

      // Click on behalf radio
      fireEvent.click(behalfRadio);

      expect(individualRadio.checked).toBe(false);
      expect(behalfRadio.checked).toBe(true);

      // Click back on individual radio
      fireEvent.click(individualRadio);

      expect(individualRadio.checked).toBe(true);
      expect(behalfRadio.checked).toBe(false);
    });
  });
});
