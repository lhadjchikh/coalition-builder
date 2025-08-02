import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SSRFooter from "../SSRFooter";
import { HomePage } from "@shared/types";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

// Mock shared Footer component to verify props are passed correctly
const mockFooter = jest.fn();
jest.mock("@shared/components/Footer", () => {
  return (props: any) => {
    mockFooter(props);
    const { orgInfo, LinkComponent } = props;

    if (!orgInfo) return null;

    return (
      <footer data-testid="footer">
        <h3>{orgInfo.organization_name}</h3>
        <nav aria-label="Legal links">
          <LinkComponent to="/terms" className="footer-link">
            Terms of Use
          </LinkComponent>
          <LinkComponent to="/privacy" className="footer-link">
            Privacy Policy
          </LinkComponent>
        </nav>
      </footer>
    );
  };
});

describe("SSRFooter", () => {
  const mockOrgInfo: HomePage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Test Tagline",
    hero_title: "Test Hero",
    hero_subtitle: "Test Subtitle",
    hero_overlay_enabled: false,
    hero_overlay_color: "#000000",
    hero_overlay_opacity: 0.5,
    cta_title: "Test CTA",
    cta_content: "Test Content",
    cta_button_text: "Test Button",
    cta_button_url: "https://example.com",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Test Campaigns",
    campaigns_section_subtitle: "Test Subtitle",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    theme: {
      id: 1,
      name: "Test Theme",
      primary_color: "#000000",
      secondary_color: "#111111",
      accent_color: "#222222",
      background_color: "#FFFFFF",
      section_background_color: "#F5F5F5",
      card_background_color: "#FAFAFA",
      heading_color: "#000000",
      body_text_color: "#333333",
      muted_text_color: "#666666",
      link_color: "#0066CC",
      link_hover_color: "#0052A3",
      heading_font_family: "Inter",
      body_font_family: "Inter",
      google_fonts: [],
      font_size_base: 16,
      font_size_small: 14,
      font_size_large: 18,
      logo_url: "",
      logo_alt_text: "",
      is_active: true,
      created_at: "2024-01-01T00:00:00+00:00",
      updated_at: "2024-01-01T00:00:00+00:00",
    },
  };

  beforeEach(() => {
    mockFooter.mockClear();
  });

  it("renders Footer with correct orgInfo prop", () => {
    render(<SSRFooter orgInfo={mockOrgInfo} />);

    expect(mockFooter).toHaveBeenCalledWith(
      expect.objectContaining({
        orgInfo: mockOrgInfo,
      }),
    );
  });

  it('passes a LinkComponent that accepts "to" prop and renders Next.js Link', () => {
    render(<SSRFooter orgInfo={mockOrgInfo} />);

    // Get the LinkComponent that was passed to Footer
    const { LinkComponent } = mockFooter.mock.calls[0][0];
    expect(LinkComponent).toBeDefined();

    // Render the LinkComponent directly to test it
    const { container } = render(
      <LinkComponent to="/test-path" className="test-class">
        Test Link
      </LinkComponent>,
    );

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/test-path");
    expect(link).toHaveAttribute("class", "test-class");
    expect(link).toHaveTextContent("Test Link");
  });

  it("renders footer with correct legal links using Next.js Link component", () => {
    render(<SSRFooter orgInfo={mockOrgInfo} />);

    // Check that the footer is rendered
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("Test Organization")).toBeInTheDocument();

    // Check that legal links are rendered with correct href attributes
    const termsLink = screen.getByRole("link", { name: "Terms of Use" });
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });

    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(privacyLink).toHaveAttribute("href", "/privacy");

    // Ensure links have the expected CSS classes
    expect(termsLink).toHaveClass("footer-link");
    expect(privacyLink).toHaveClass("footer-link");
  });

  it("does not render when orgInfo is undefined", () => {
    render(<SSRFooter />);

    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });

  it('LinkComponent falls back to "/" when no "to" prop is provided', () => {
    render(<SSRFooter orgInfo={mockOrgInfo} />);

    const { LinkComponent } = mockFooter.mock.calls[0][0];

    // Test LinkComponent without "to" prop
    const { container } = render(
      <LinkComponent className="test-class">Fallback Link</LinkComponent>,
    );

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveTextContent("Fallback Link");
  });

  it('LinkComponent prioritizes "to" prop over fallback', () => {
    render(<SSRFooter orgInfo={mockOrgInfo} />);

    const { LinkComponent } = mockFooter.mock.calls[0][0];

    // Test LinkComponent with "to" prop
    const { container } = render(
      <LinkComponent to="/specific-path" className="test-class">
        Specific Link
      </LinkComponent>,
    );

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/specific-path");
  });
});
