import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CampaignsList from "../CampaignsList";

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe("CampaignsList", () => {
  const mockCampaigns = [
    {
      id: 1,
      name: "campaign-1",
      title: "Save the Bay",
      summary: "Campaign to protect the Chesapeake Bay",
      image_url: "https://example.com/bay.jpg",
      image_alt_text: "Chesapeake Bay",
      image_author: "John Photographer",
      image_license: "CC BY 4.0",
      image_source_url: "https://example.com/source",
      allow_endorsements: true,
      active: true,
    },
    {
      id: 2,
      name: "campaign-2",
      title: "Clean Water Initiative",
      summary: "Ensuring clean water for all communities",
      description: "Detailed description of the clean water initiative",
      allow_endorsements: false,
      active: true,
    },
    {
      id: 3,
      name: "campaign-3",
      title: "Climate Action Now",
      summary: "Urgent action on climate change",
      image_url: "https://example.com/climate.jpg",
      active: true,
    },
  ];

  const defaultProps = {
    campaigns: mockCampaigns,
    onCampaignSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset IntersectionObserver mock
    mockIntersectionObserver.mockClear();
  });

  describe("Basic rendering", () => {
    it("renders all campaigns", () => {
      render(<CampaignsList {...defaultProps} />);

      expect(screen.getByText("Save the Bay")).toBeInTheDocument();
      expect(screen.getByText("Clean Water Initiative")).toBeInTheDocument();
      expect(screen.getByText("Climate Action Now")).toBeInTheDocument();
    });

    it("renders campaign summaries", () => {
      render(<CampaignsList {...defaultProps} />);

      expect(
        screen.getByText("Campaign to protect the Chesapeake Bay"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Ensuring clean water for all communities"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Urgent action on climate change"),
      ).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<CampaignsList {...defaultProps} className="custom-campaigns" />);

      const container = screen.getByTestId("campaigns-list");
      expect(container).toHaveClass("campaigns-list", "custom-campaigns");
    });

    it("renders with custom grid className", () => {
      const customGrid = "grid grid-cols-2 gap-4";
      render(<CampaignsList {...defaultProps} gridClassName={customGrid} />);

      const gridContainer = screen.getByText("Save the Bay").closest(".grid");
      expect(gridContainer).toHaveClass("grid", "grid-cols-2", "gap-4");
    });
  });

  describe("Loading and error states", () => {
    it("displays loading state", () => {
      render(<CampaignsList campaigns={[]} loading={true} />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Loading campaigns...")).toBeInTheDocument();

      const spinner = screen
        .getByTestId("loading")
        .querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("displays error state", () => {
      const errorMessage = "Failed to fetch campaigns";
      render(<CampaignsList campaigns={[]} error={errorMessage} />);

      expect(screen.getByTestId("error")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("displays empty state when no campaigns", () => {
      render(<CampaignsList campaigns={[]} />);

      expect(
        screen.getByText("No campaigns are currently available."),
      ).toBeInTheDocument();
    });
  });

  describe("Campaign cards", () => {
    it("renders campaign images with ImageWithCredit component", () => {
      render(<CampaignsList {...defaultProps} />);

      // First campaign has full image credits
      const bayImage = screen.getByAltText("Chesapeake Bay");
      expect(bayImage).toHaveAttribute("src", "https://example.com/bay.jpg");

      // Third campaign has image but no credits
      const climateImage = screen.getByAltText("Climate Action Now");
      expect(climateImage).toHaveAttribute(
        "src",
        "https://example.com/climate.jpg",
      );
    });

    it("does not render image section when no image_url", () => {
      render(<CampaignsList {...defaultProps} />);

      // Second campaign has no image
      const campaign2Card = screen.getByTestId("campaign-2");
      const imageSection = campaign2Card.querySelector(".relative.h-48");
      expect(imageSection).not.toBeInTheDocument();
    });

    it("shows endorsements badge when allow_endorsements is true", () => {
      render(<CampaignsList {...defaultProps} />);

      const endorsementBadges = screen.getAllByText("Accepting endorsements");
      expect(endorsementBadges).toHaveLength(1); // Only first campaign has allow_endorsements: true
    });

    it("does not show endorsements badge when allow_endorsements is false", () => {
      render(<CampaignsList {...defaultProps} />);

      const campaign2Card = screen.getByTestId("campaign-2");
      const endorsementBadge = campaign2Card.querySelector(".text-green-600");
      expect(endorsementBadge).not.toBeInTheDocument();
    });

    it("applies custom card className", () => {
      render(
        <CampaignsList {...defaultProps} cardClassName="custom-card-class" />,
      );

      const cards = screen.getAllByRole("button");
      cards.forEach((card: HTMLElement) => {
        expect(card).toHaveClass("custom-card-class");
      });
    });
  });

  describe("Interaction", () => {
    it("calls onCampaignSelect when card is clicked", () => {
      const mockSelect = jest.fn();
      render(<CampaignsList {...defaultProps} onCampaignSelect={mockSelect} />);

      fireEvent.click(screen.getByTestId("campaign-1"));
      expect(mockSelect).toHaveBeenCalledWith(mockCampaigns[0]);
    });

    it("calls onCampaignSelect when Enter key is pressed", () => {
      const mockSelect = jest.fn();
      render(<CampaignsList {...defaultProps} onCampaignSelect={mockSelect} />);

      const card = screen.getByTestId("campaign-2");
      fireEvent.keyDown(card, { key: "Enter" });
      expect(mockSelect).toHaveBeenCalledWith(mockCampaigns[1]);
    });

    it("calls onCampaignSelect when Space key is pressed", () => {
      const mockSelect = jest.fn();
      render(<CampaignsList {...defaultProps} onCampaignSelect={mockSelect} />);

      const card = screen.getByTestId("campaign-3");
      fireEvent.keyDown(card, { key: " " });
      expect(mockSelect).toHaveBeenCalledWith(mockCampaigns[2]);
    });

    it("does not call onCampaignSelect for other keys", () => {
      const mockSelect = jest.fn();
      render(<CampaignsList {...defaultProps} onCampaignSelect={mockSelect} />);

      const card = screen.getByTestId("campaign-1");
      fireEvent.keyDown(card, { key: "Tab" });
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("Heading display", () => {
    it("does not show heading by default", () => {
      render(<CampaignsList {...defaultProps} />);

      expect(
        screen.queryByRole("heading", { level: 2 }),
      ).not.toBeInTheDocument();
    });

    it("shows heading when showHeading is true", () => {
      render(<CampaignsList {...defaultProps} showHeading={true} />);

      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
      expect(screen.getByText("Policy Campaigns")).toBeInTheDocument();
    });

    it("shows custom heading text", () => {
      render(
        <CampaignsList
          {...defaultProps}
          showHeading={true}
          headingText="Active Initiatives"
        />,
      );

      expect(screen.getByText("Active Initiatives")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<CampaignsList {...defaultProps} />);

      const cards = screen.getAllByRole("button");
      expect(cards).toHaveLength(3);

      expect(cards[0]).toHaveAttribute(
        "aria-label",
        "View details for Save the Bay",
      );
      expect(cards[1]).toHaveAttribute(
        "aria-label",
        "View details for Clean Water Initiative",
      );
    });

    it("has proper tabIndex for keyboard navigation", () => {
      render(<CampaignsList {...defaultProps} />);

      const cards = screen.getAllByRole("button");
      cards.forEach((card: HTMLElement) => {
        expect(card).toHaveAttribute("tabIndex", "0");
      });
    });

    it("has data-testid attributes for testing", () => {
      render(<CampaignsList {...defaultProps} />);

      expect(screen.getByTestId("campaigns-list")).toBeInTheDocument();
      expect(screen.getByTestId("campaign-1")).toBeInTheDocument();
      expect(screen.getByTestId("campaign-2")).toBeInTheDocument();
      expect(screen.getByTestId("campaign-3")).toBeInTheDocument();
    });
  });

  describe("Animation with IntersectionObserver", () => {
    it("sets up IntersectionObserver for animations", () => {
      render(<CampaignsList {...defaultProps} />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          threshold: 0.1,
          rootMargin: "50px",
        },
      );
    });

    it("observes all campaign cards", () => {
      const observeMock = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: observeMock,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      });

      render(<CampaignsList {...defaultProps} />);

      expect(observeMock).toHaveBeenCalledTimes(3); // One for each campaign
    });

    it("disconnects observer on unmount", () => {
      const disconnectMock = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: disconnectMock,
      });

      const { unmount } = render(<CampaignsList {...defaultProps} />);
      unmount();

      expect(disconnectMock).toHaveBeenCalled();
    });

    it("applies animation delay styles", () => {
      render(<CampaignsList {...defaultProps} />);

      const card1 = screen.getByTestId("campaign-1");
      const card2 = screen.getByTestId("campaign-2");
      const card3 = screen.getByTestId("campaign-3");

      expect(card1).toHaveStyle({ transitionDelay: "0ms" });
      expect(card2).toHaveStyle({ transitionDelay: "100ms" });
      expect(card3).toHaveStyle({ transitionDelay: "200ms" });
    });

    it("adds visible class when intersection occurs", async () => {
      let intersectionCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      render(<CampaignsList {...defaultProps} />);

      const card1 = screen.getByTestId("campaign-1");
      expect(card1).not.toHaveClass("campaign-card-visible");

      // Simulate intersection
      await waitFor(() => {
        intersectionCallback!(
          [
            {
              isIntersecting: true,
              target: card1,
            } as any,
          ],
          {} as any,
        );
      });

      await waitFor(() => {
        expect(card1).toHaveClass("campaign-card-visible");
      });
    });
  });

  describe("SSR compatibility", () => {
    it("renders without IntersectionObserver in SSR", () => {
      // Temporarily remove IntersectionObserver
      const originalIO = window.IntersectionObserver;
      delete (window as any).IntersectionObserver;

      render(<CampaignsList {...defaultProps} />);

      // All cards should be visible immediately
      const cards = screen.getAllByRole("button");
      cards.forEach((card: HTMLElement) => {
        expect(card).toHaveClass("campaign-card-visible");
      });

      // Restore IntersectionObserver
      window.IntersectionObserver = originalIO;
    });

    it("handles undefined window gracefully", () => {
      // This test simulates SSR environment behavior
      // In a real SSR environment, window would be undefined
      // Here we just test that the component renders without errors

      expect(() => {
        render(<CampaignsList {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("handles campaigns with minimal data", () => {
      const minimalCampaigns = [
        {
          id: 1,
          name: "minimal",
          title: "Minimal Campaign",
          summary: "Basic summary",
        },
      ];

      render(<CampaignsList campaigns={minimalCampaigns} />);

      expect(screen.getByText("Minimal Campaign")).toBeInTheDocument();
      expect(screen.getByText("Basic summary")).toBeInTheDocument();
    });

    it("handles very long text content", () => {
      const longTextCampaigns = [
        {
          id: 1,
          name: "long-text",
          title: "A".repeat(100),
          summary: "B".repeat(200),
        },
      ];

      render(<CampaignsList campaigns={longTextCampaigns} />);

      expect(screen.getByText("A".repeat(100))).toBeInTheDocument();
      expect(screen.getByText("B".repeat(200))).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      const specialCampaigns = [
        {
          id: 1,
          name: "special",
          title: 'Campaign & "Testing"',
          summary: "Summary with <special> characters & symbols",
        },
      ];

      render(<CampaignsList campaigns={specialCampaigns} />);

      expect(screen.getByText('Campaign & "Testing"')).toBeInTheDocument();
      expect(
        screen.getByText("Summary with <special> characters & symbols"),
      ).toBeInTheDocument();
    });

    it("does not render if onCampaignSelect is not provided", () => {
      render(<CampaignsList campaigns={mockCampaigns} />);

      // Should still render, just clicking won't do anything
      const card = screen.getByTestId("campaign-1");
      fireEvent.click(card);
      // No error should occur
    });
  });

  describe("Image credit integration", () => {
    it("passes correct props to ImageWithCredit", () => {
      render(<CampaignsList {...defaultProps} />);

      // Verify the image with full credits
      const bayImage = screen.getByAltText("Chesapeake Bay");
      const imageContainer = bayImage.closest(".w-full.h-full");

      expect(imageContainer).toBeInTheDocument();
      expect(bayImage).toHaveClass("w-full", "h-full", "object-cover");
    });

    it("uses campaign title as fallback for image alt text", () => {
      const campaignsWithoutAlt = [
        {
          id: 1,
          name: "no-alt",
          title: "Campaign Without Alt",
          summary: "Test summary",
          image_url: "https://example.com/test.jpg",
        },
      ];

      render(<CampaignsList campaigns={campaignsWithoutAlt} />);

      const image = screen.getByAltText("Campaign Without Alt");
      expect(image).toBeInTheDocument();
    });
  });
});
