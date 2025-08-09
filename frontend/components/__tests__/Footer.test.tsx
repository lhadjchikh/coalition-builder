import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";
import { HomePage } from "../../types/index";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock data
const mockHomepage: HomePage = {
  id: 1,
  organization_name: "Test Organization",
  tagline: "Test tagline",
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
  hero_overlay_enabled: false,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 0.5,
  cta_title: "CTA Title",
  cta_content: "CTA Content",
  cta_button_text: "CTA Button",
  cta_button_url: "/campaigns",
  campaigns_section_title: "Our Campaigns",
  show_campaigns_section: true,
  is_active: true,
  created_at: "2023-01-01",
  updated_at: "2023-01-01",
};

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
  }: {
    href?: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = "Link";
  return MockLink;
});

describe("Footer navigation", () => {
  it("renders Terms of Use and Privacy Policy links", () => {
    render(<Footer orgInfo={mockHomepage} />);

    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("renders Terms of Use link with correct href", () => {
    render(<Footer orgInfo={mockHomepage} />);

    const termsLink = screen.getByText("Terms of Use");
    expect(termsLink).toHaveAttribute("href", "/terms");
  });

  it("renders Privacy Policy link with correct href", () => {
    render(<Footer orgInfo={mockHomepage} />);

    const privacyLink = screen.getByText("Privacy Policy");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("renders all main navigation links", () => {
    render(<Footer orgInfo={mockHomepage} />);

    expect(screen.getByText("Home")).toHaveAttribute("href", "/");
    expect(screen.getByText("Campaigns")).toHaveAttribute("href", "/campaigns");
    expect(screen.getByText("About")).toHaveAttribute("href", "/about");
    expect(screen.getByText("Contact")).toHaveAttribute("href", "/contact");
  });

  it("renders organization name and tagline", () => {
    render(<Footer orgInfo={mockHomepage} />);

    expect(screen.getByText("Test Organization")).toBeInTheDocument();
    expect(screen.getByText("Test tagline")).toBeInTheDocument();
  });
});
