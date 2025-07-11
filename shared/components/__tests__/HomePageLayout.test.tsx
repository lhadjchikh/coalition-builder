import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePageLayout from "../HomePageLayout";
import type { HomePage, Campaign } from "@frontend/types";
import type { NavItemData } from "@shared/types";

// Mock process.env
const mockEnv = {
  NODE_ENV: "test" as const,
};

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv, ...mockEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock data
const mockHomepage: HomePage = {
  id: 1,
  organization_name: "Test Organization",
  tagline: "Test Tagline",
  hero_title: "Test Hero Title",
  hero_subtitle: "Test Hero Subtitle",
  hero_background_image: "hero.jpg",
  about_section_title: "About Us",
  about_section_content: "<p>About content</p>",
  cta_title: "Get Involved",
  cta_content: "Join our mission",
  cta_button_text: "Learn More",
  cta_button_url: "https://example.com",
  contact_email: "contact@test.org",
  contact_phone: "555-1234",
  facebook_url: "https://facebook.com/test",
  twitter_url: "https://twitter.com/test",
  instagram_url: "https://instagram.com/test",
  linkedin_url: "https://linkedin.com/test",
  campaigns_section_title: "Our Campaigns",
  campaigns_section_subtitle: "Current initiatives",
  show_campaigns_section: true,
  content_blocks: [],
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: "test-campaign",
    title: "Test Campaign",
    summary: "Test campaign summary",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "another-campaign",
    title: "Another Campaign",
    summary: "Another campaign summary",
    active: true,
    created_at: "2023-01-02T00:00:00Z",
  },
];

const mockNavItems: NavItemData[] = [
  { label: "About", href: "#about-section" },
  { label: "Campaigns", href: "#campaigns-section" },
  { label: "Contact", href: "#footer" },
];

// Mock components
const MockHeroComponent = ({ homepage }: { homepage: HomePage }) => (
  <div data-testid="mock-hero">Hero: {homepage.hero_title}</div>
);

const MockContentBlockComponent = ({ block }: { block: any }) => (
  <div data-testid="mock-content-block">Block: {block.title}</div>
);

const MockSocialLinksComponent = ({ homepage }: { homepage: HomePage }) => (
  <div data-testid="mock-social-links">
    Social: {homepage.organization_name}
  </div>
);

const MockNavbarComponent = ({
  organizationName,
  navItems,
}: {
  organizationName?: string;
  navItems?: NavItemData[];
}) => (
  <nav data-testid="mock-navbar">
    <span>{organizationName}</span>
    {navItems?.map((item, index) => (
      <a key={index} href={item.href}>
        {item.label}
      </a>
    ))}
  </nav>
);

describe("HomePageLayout", () => {
  const defaultProps = {
    homepage: mockHomepage,
    campaigns: mockCampaigns,
  };

  describe("basic rendering", () => {
    it("should render without crashing", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("should render hero section with default component", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getByText("Test Hero Title")).toBeInTheDocument();
      expect(screen.getByText("Test Hero Subtitle")).toBeInTheDocument();
    });

    it("should render about section", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getByText("About Us")).toBeInTheDocument();
      expect(screen.getByText("About content")).toBeInTheDocument();
    });

    it("should render campaigns section", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getByText("Our Campaigns")).toBeInTheDocument();
      expect(screen.getByText("Current initiatives")).toBeInTheDocument();
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
      expect(screen.getByText("Another Campaign")).toBeInTheDocument();
    });

    it("should render CTA section", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getByText("Get Involved")).toBeInTheDocument();
      expect(screen.getByText("Join our mission")).toBeInTheDocument();
      expect(screen.getAllByText("Learn More")).toHaveLength(2); // Hero and CTA sections
    });

    it("should render footer", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.getAllByText("Test Organization")).toHaveLength(1); // Only in footer for basic test
      expect(screen.getByText("Test Tagline")).toBeInTheDocument();
      expect(screen.getByText("contact@test.org")).toBeInTheDocument();
      expect(screen.getByText("555-1234")).toBeInTheDocument();
    });
  });

  describe("custom components", () => {
    it("should render custom hero component", () => {
      render(
        <HomePageLayout {...defaultProps} HeroComponent={MockHeroComponent} />,
      );
      expect(screen.getByTestId("mock-hero")).toBeInTheDocument();
      expect(screen.getByText("Hero: Test Hero Title")).toBeInTheDocument();
    });

    it("should render custom navbar component", () => {
      render(
        <HomePageLayout
          {...defaultProps}
          NavbarComponent={MockNavbarComponent}
          navItems={mockNavItems}
        />,
      );
      expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
      expect(screen.getAllByText("Test Organization")).toHaveLength(2); // Navbar and footer
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Campaigns")).toBeInTheDocument();
    });

    it("should render custom social links component", () => {
      render(
        <HomePageLayout
          {...defaultProps}
          SocialLinksComponent={MockSocialLinksComponent}
        />,
      );
      expect(screen.getByTestId("mock-social-links")).toBeInTheDocument();
      expect(screen.getByText("Social: Test Organization")).toBeInTheDocument();
    });

    it("should render custom content blocks", () => {
      const homepageWithBlocks = {
        ...mockHomepage,
        content_blocks: [
          { id: 1, title: "Block 1", is_visible: true, order: 1 },
          { id: 2, title: "Block 2", is_visible: true, order: 2 },
        ],
      };

      render(
        <HomePageLayout
          {...defaultProps}
          homepage={homepageWithBlocks}
          ContentBlockComponent={MockContentBlockComponent}
        />,
      );
      expect(screen.getByText("Block: Block 1")).toBeInTheDocument();
      expect(screen.getByText("Block: Block 2")).toBeInTheDocument();
    });
  });

  describe("conditional rendering", () => {
    it("should not render navbar when NavbarComponent is not provided", () => {
      render(<HomePageLayout {...defaultProps} />);
      expect(screen.queryByTestId("mock-navbar")).not.toBeInTheDocument();
    });

    it("should not render about section when content is empty", () => {
      const homepageWithoutAbout = {
        ...mockHomepage,
        about_section_content: "",
      };
      render(
        <HomePageLayout {...defaultProps} homepage={homepageWithoutAbout} />,
      );
      expect(screen.queryByText("About Us")).not.toBeInTheDocument();
    });

    it("should not render campaigns section when show_campaigns_section is false", () => {
      const homepageWithoutCampaigns = {
        ...mockHomepage,
        show_campaigns_section: false,
      };
      render(
        <HomePageLayout
          {...defaultProps}
          homepage={homepageWithoutCampaigns}
        />,
      );
      expect(screen.queryByText("Our Campaigns")).not.toBeInTheDocument();
    });

    it("should not render CTA section when cta_content is empty", () => {
      const homepageWithoutCTA = {
        ...mockHomepage,
        cta_content: "",
      };
      render(
        <HomePageLayout {...defaultProps} homepage={homepageWithoutCTA} />,
      );
      expect(screen.queryByText("Get Involved")).not.toBeInTheDocument();
    });

    it("should not render CTA button when URL or text is missing", () => {
      const homepageWithoutCTAButton = {
        ...mockHomepage,
        cta_button_url: "",
      };
      render(
        <HomePageLayout
          {...defaultProps}
          homepage={homepageWithoutCTAButton}
        />,
      );
      expect(screen.queryByText("Learn More")).not.toBeInTheDocument();
    });

    it("should not render hero button when URL or text is missing", () => {
      const homepageWithoutHeroButton = {
        ...mockHomepage,
        cta_button_url: "",
      };
      render(
        <HomePageLayout
          {...defaultProps}
          homepage={homepageWithoutHeroButton}
        />,
      );
      const heroSection = screen
        .getByText("Test Hero Title")
        .closest("section");
      expect(heroSection?.querySelector("a")).not.toBeInTheDocument();
    });

    it("should not render phone number when not provided", () => {
      const homepageWithoutPhone = {
        ...mockHomepage,
        contact_phone: "",
      };
      render(
        <HomePageLayout {...defaultProps} homepage={homepageWithoutPhone} />,
      );
      expect(screen.queryByText("555-1234")).not.toBeInTheDocument();
    });

    it("should filter and sort visible content blocks", () => {
      const homepageWithBlocks = {
        ...mockHomepage,
        content_blocks: [
          { id: 1, title: "Block 1", is_visible: false, order: 1 },
          { id: 2, title: "Block 2", is_visible: true, order: 3 },
          { id: 3, title: "Block 3", is_visible: true, order: 1 },
        ],
      };

      render(
        <HomePageLayout
          {...defaultProps}
          homepage={homepageWithBlocks}
          ContentBlockComponent={MockContentBlockComponent}
        />,
      );

      expect(screen.queryByText("Block: Block 1")).not.toBeInTheDocument();
      expect(screen.getByText("Block: Block 3")).toBeInTheDocument();
      expect(screen.getByText("Block: Block 2")).toBeInTheDocument();
    });
  });

  describe("campaign interactions", () => {
    it("should call onCampaignSelect when provided", () => {
      const mockOnCampaignSelect = jest.fn();
      render(
        <HomePageLayout
          {...defaultProps}
          onCampaignSelect={mockOnCampaignSelect}
        />,
      );

      const learnMoreButton = screen.getAllByText("Learn more →")[0];
      fireEvent.click(learnMoreButton);

      expect(mockOnCampaignSelect).toHaveBeenCalledWith(mockCampaigns[0]);
    });

    it("should render campaign links when onCampaignSelect is not provided", () => {
      render(<HomePageLayout {...defaultProps} />);

      const campaignLinks = screen.getAllByText("Learn more →");
      expect(campaignLinks[0]).toHaveAttribute(
        "href",
        "/campaigns/test-campaign",
      );
      expect(campaignLinks[1]).toHaveAttribute(
        "href",
        "/campaigns/another-campaign",
      );
    });

    it("should display empty state when no campaigns", () => {
      render(<HomePageLayout {...defaultProps} campaigns={[]} />);
      expect(
        screen.getByText("No campaigns are currently available."),
      ).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should display homepage error in development", () => {
      process.env = { ...originalEnv, NODE_ENV: "development" };
      render(
        <HomePageLayout
          {...defaultProps}
          homepageError="Failed to load homepage"
        />,
      );

      expect(screen.getByText("Development Notice")).toBeInTheDocument();
      expect(screen.getByText(/Failed to load homepage/)).toBeInTheDocument();
    });

    it("should not display homepage error in production", () => {
      process.env = { ...originalEnv, NODE_ENV: "production" };
      render(
        <HomePageLayout
          {...defaultProps}
          homepageError="Failed to load homepage"
        />,
      );

      expect(screen.queryByText("Development Notice")).not.toBeInTheDocument();
    });

    it("should display campaigns error when no campaigns available", () => {
      render(
        <HomePageLayout
          {...defaultProps}
          campaigns={[]}
          campaignsError="Failed to load campaigns"
        />,
      );

      expect(
        screen.getByText("Unable to load campaigns at this time."),
      ).toBeInTheDocument();
    });

    it("should display detailed campaigns error in development", () => {
      process.env = { ...originalEnv, NODE_ENV: "development" };
      render(
        <HomePageLayout
          {...defaultProps}
          campaigns={[]}
          campaignsError="Failed to load campaigns"
        />,
      );

      expect(screen.getByText("Failed to load campaigns")).toBeInTheDocument();
    });

    it("should not display detailed campaigns error in production", () => {
      process.env = { ...originalEnv, NODE_ENV: "production" };
      render(
        <HomePageLayout
          {...defaultProps}
          campaigns={[]}
          campaignsError="Failed to load campaigns"
        />,
      );

      expect(
        screen.queryByText("Failed to load campaigns"),
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<HomePageLayout {...defaultProps} />);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      render(<HomePageLayout {...defaultProps} />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Test Hero Title");

      const h2Elements = screen.getAllByRole("heading", { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it("should have proper link attributes", () => {
      render(<HomePageLayout {...defaultProps} />);

      const emailLink = screen.getByText("contact@test.org");
      expect(emailLink).toHaveAttribute("href", "mailto:contact@test.org");

      const phoneLink = screen.getByText("555-1234");
      expect(phoneLink).toHaveAttribute("href", "tel:555-1234");
    });

    it("should have proper ARIA labels and roles", () => {
      render(<HomePageLayout {...defaultProps} />);

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();

      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("styling and classes", () => {
    it("should apply correct CSS classes", () => {
      render(<HomePageLayout {...defaultProps} />);

      const container = screen.getByRole("main").parentElement;
      expect(container).toHaveClass("min-h-screen", "bg-white");
    });

    it("should apply hover and transition classes", () => {
      render(<HomePageLayout {...defaultProps} />);

      const campaignCards = screen.getAllByText("Learn more →");
      const firstCard = campaignCards[0].closest("div");
      expect(firstCard).toHaveClass("hover:shadow-lg", "transition-shadow");
    });
  });

  describe("dangerouslySetInnerHTML", () => {
    it("should render HTML content safely", () => {
      const homepageWithHTML = {
        ...mockHomepage,
        about_section_content:
          "<strong>Bold content</strong> with <em>emphasis</em>",
      };

      render(<HomePageLayout {...defaultProps} homepage={homepageWithHTML} />);

      const aboutSection = screen.getByText("Bold content");
      expect(aboutSection).toBeInTheDocument();
      expect(aboutSection.tagName).toBe("STRONG");
    });

    it("should handle empty HTML content", () => {
      const homepageWithEmptyHTML = {
        ...mockHomepage,
        about_section_content: "",
      };

      render(
        <HomePageLayout {...defaultProps} homepage={homepageWithEmptyHTML} />,
      );
      expect(screen.queryByText("About Us")).not.toBeInTheDocument();
    });
  });

  describe("responsive design", () => {
    it("should apply responsive classes", () => {
      render(<HomePageLayout {...defaultProps} />);

      const heroTitle = screen.getByText("Test Hero Title");
      expect(heroTitle).toHaveClass("text-4xl", "sm:text-5xl", "md:text-6xl");
    });

    it("should apply responsive grid classes for campaigns", () => {
      render(<HomePageLayout {...defaultProps} />);

      const campaignsGrid = screen
        .getByText("Test Campaign")
        .closest("div")?.parentElement;
      expect(campaignsGrid).toHaveClass(
        "grid",
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-3",
      );
    });
  });
});
