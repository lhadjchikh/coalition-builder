import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EndorsementForm from "../EndorsementForm";
import { Campaign } from "../../types/index";
import API from "../../lib/api";
import analytics from "../../services/analytics";

// Mock API and analytics
jest.mock("../../lib/api", () => ({
  __esModule: true,
  default: {
    getHomepage: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    getCampaignByName: jest.fn(),
    getCampaign: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getEndorsements: jest.fn(),
    getCampaignEndorsements: jest.fn(),
    createEndorsement: jest.fn(),
    getHomepageById: jest.fn(),
    getContentBlocks: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
    getContentBlocksByHomepageId: jest.fn(),
    getContentBlock: jest.fn(),
    getTermsOfUse: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    healthCheck: jest.fn(),
  },
  ssrApiClient: {
    getHomepage: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    getCampaignByName: jest.fn(),
    getCampaign: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getEndorsements: jest.fn(),
    getCampaignEndorsements: jest.fn(),
    createEndorsement: jest.fn(),
    getHomepageById: jest.fn(),
    getContentBlocks: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
    getContentBlocksByHomepageId: jest.fn(),
    getContentBlock: jest.fn(),
    getTermsOfUse: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    healthCheck: jest.fn(),
  },
  apiClient: {
    getHomepage: jest.fn(),
    getCampaigns: jest.fn(),
    getCampaignById: jest.fn(),
    getCampaignByName: jest.fn(),
    getCampaign: jest.fn(),
    getEndorsers: jest.fn(),
    getLegislators: jest.fn(),
    getEndorsements: jest.fn(),
    getCampaignEndorsements: jest.fn(),
    createEndorsement: jest.fn(),
    getHomepageById: jest.fn(),
    getContentBlocks: jest.fn(),
    getContentBlocksByPageType: jest.fn(),
    getContentBlocksByHomepageId: jest.fn(),
    getContentBlock: jest.fn(),
    getTermsOfUse: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    healthCheck: jest.fn(),
  },
}));
jest.mock("../../services/analytics");

// Mock SocialShareButtons component
jest.mock("../SocialShareButtons", () => {
  return function MockSocialShareButtons(props: {
    onShare?: (platform: string) => void;
    [key: string]: unknown;
  }) {
    return (
      <div data-testid="social-share-buttons">
        <button onClick={() => props.onShare?.("facebook")}>
          Share on Facebook
        </button>
        <div>URL: {props.url}</div>
        <div>Title: {props.title}</div>
      </div>
    );
  };
});

describe("EndorsementForm", () => {
  const mockCampaign: Campaign = {
    id: 1,
    name: "test-campaign",
    title: "Test Campaign",
    summary: "Test Summary",
    description: "Test Description",
    allow_endorsements: true,
    created_at: "2024-01-01",
  };

  const mockOnEndorsementSubmitted = jest.fn();
  const mockOnFormInteraction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock responses
    (API.createEndorsement as jest.Mock).mockResolvedValue({
      id: 1,
      campaign_id: 1,
      stakeholder_id: 1,
    });
  });

  it("handles honeypot field changes", () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    // Test homepage honeypot field
    const homepageField = screen.getByLabelText(/homepage.*leave blank/i);
    fireEvent.change(homepageField, { target: { value: "spam-value" } });
    expect(homepageField).toHaveValue("spam-value");

    // Test confirm_email honeypot field
    const confirmEmailField = screen.getByLabelText(
      /confirm email.*leave blank/i
    );
    fireEvent.change(confirmEmailField, { target: { value: "spam@test.com" } });
    expect(confirmEmailField).toHaveValue("spam@test.com");
  });

  it("handles public display checkbox change", () => {
    render(<EndorsementForm campaign={mockCampaign} />);

    const publicDisplayCheckbox = screen.getByTestId("public-display-checkbox");

    // Should be checked by default
    expect(publicDisplayCheckbox).toBeChecked();

    // Uncheck it
    fireEvent.click(publicDisplayCheckbox);
    expect(publicDisplayCheckbox).not.toBeChecked();

    // Check it again
    fireEvent.click(publicDisplayCheckbox);
    expect(publicDisplayCheckbox).toBeChecked();
  });

  describe("Social Sharing Integration", () => {
    it("displays social share buttons after successful submission", async () => {
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
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Springfield" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "IL" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "62701" },
      });
      fireEvent.click(screen.getByTestId("terms-checkbox"));

      // Submit form
      fireEvent.click(screen.getByTestId("submit-button"));

      // Wait for success message
      await waitFor(() => {
        expect(
          screen.getByText("Thank you for your endorsement!")
        ).toBeInTheDocument();
      });

      // Check that social share buttons are displayed
      expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      expect(
        screen.getByText("Help amplify your support by sharing this campaign:")
      ).toBeInTheDocument();
    });

    it("passes correct props to SocialShareButtons component", async () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill and submit form
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Springfield" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "IL" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "62701" },
      });
      fireEvent.click(screen.getByTestId("terms-checkbox"));
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("social-share-buttons")).toBeInTheDocument();
      });

      // Check the props passed to SocialShareButtons
      expect(
        screen.getByText(
          `URL: ${window.location.origin}/campaigns/${mockCampaign.name}`
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Title: I just endorsed ${mockCampaign.title}!`)
      ).toBeInTheDocument();
    });

    it("tracks analytics when endorsement is submitted", async () => {
      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill and submit form
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Springfield" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "IL" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "62701" },
      });
      fireEvent.click(screen.getByTestId("terms-checkbox"));
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(analytics.trackEndorsementSubmission).toHaveBeenCalledWith(
          mockCampaign.name
        );
      });
    });

    it("does not show share buttons when submission fails", async () => {
      (API.createEndorsement as jest.Mock).mockRejectedValue(
        new Error("Submission failed")
      );

      render(<EndorsementForm campaign={mockCampaign} />);

      // Fill and submit form
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Springfield" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "IL" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "62701" },
      });
      fireEvent.click(screen.getByTestId("terms-checkbox"));
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
      });

      // Should not show social share buttons
      expect(
        screen.queryByTestId("social-share-buttons")
      ).not.toBeInTheDocument();
    });

    it("calls onFormInteraction callback when form gains and loses focus", () => {
      render(
        <EndorsementForm
          campaign={mockCampaign}
          onFormInteraction={mockOnFormInteraction}
        />
      );

      const firstNameInput = screen.getByTestId("first-name-input");

      // Focus on form
      fireEvent.focus(firstNameInput);
      expect(mockOnFormInteraction).toHaveBeenCalledWith(true);

      // Blur from form
      fireEvent.blur(firstNameInput);
      expect(mockOnFormInteraction).toHaveBeenCalledWith(false);
    });

    it("calls onEndorsementSubmitted callback after successful submission", async () => {
      render(
        <EndorsementForm
          campaign={mockCampaign}
          onEndorsementSubmitted={mockOnEndorsementSubmitted}
        />
      );

      // Fill and submit form
      fireEvent.change(screen.getByTestId("type-select"), {
        target: { value: "individual" },
      });
      fireEvent.change(screen.getByTestId("first-name-input"), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByTestId("last-name-input"), {
        target: { value: "Doe" },
      });
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByTestId("street-address-input"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByTestId("city-input"), {
        target: { value: "Springfield" },
      });
      fireEvent.change(screen.getByTestId("state-select"), {
        target: { value: "IL" },
      });
      fireEvent.change(screen.getByTestId("zip-code-input"), {
        target: { value: "62701" },
      });
      fireEvent.click(screen.getByTestId("terms-checkbox"));
      fireEvent.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockOnEndorsementSubmitted).toHaveBeenCalled();
      });
    });
  });

  describe("Form Validation and Edge Cases", () => {
    it("displays endorsement not allowed message when campaign does not allow endorsements", () => {
      const campaignNoEndorsements = {
        ...mockCampaign,
        allow_endorsements: false,
      };
      render(<EndorsementForm campaign={campaignNoEndorsements} />);

      expect(
        screen.getByText(
          "This campaign is not currently accepting endorsements."
        )
      ).toBeInTheDocument();
      expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument();
    });

    it("displays endorsement statement when provided", () => {
      const campaignWithStatement = {
        ...mockCampaign,
        endorsement_statement: "We support this important policy change.",
      };
      render(<EndorsementForm campaign={campaignWithStatement} />);

      expect(
        screen.getByText(
          "By submitting this form, you agree to the following statement:"
        )
      ).toBeInTheDocument();
      // Endorsement statement uses HTML entities for quotation marks
      const blockquote = document.querySelector("blockquote");
      expect(blockquote).toBeInTheDocument();
      // HTML entities are rendered as curly quotes
      expect(blockquote?.textContent).toContain(
        "We support this important policy change."
      );
    });

    it("displays endorsement form instructions when provided", () => {
      const campaignWithInstructions = {
        ...mockCampaign,
        endorsement_form_instructions:
          "<p>Please fill out all required fields.</p>",
      };
      render(<EndorsementForm campaign={campaignWithInstructions} />);

      expect(
        screen.getByText("Please fill out all required fields.")
      ).toBeInTheDocument();
    });

    it("scrolls to first field when scrollToFirstField is called", () => {
      const ref = React.createRef<{ scrollToFirstField: () => void }>();
      render(<EndorsementForm campaign={mockCampaign} ref={ref} />);

      const typeSelect = screen.getByTestId("type-select");
      const scrollIntoViewMock = jest.fn();
      const focusMock = jest.fn();
      typeSelect.scrollIntoView = scrollIntoViewMock;
      typeSelect.focus = focusMock;

      ref.current?.scrollToFirstField();

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(focusMock).toHaveBeenCalled();
    });
  });
});
