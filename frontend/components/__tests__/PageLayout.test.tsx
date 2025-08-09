import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageLayout from "../PageLayout";
import { HomePage } from "../../types/api";

const mockOrgInfo: HomePage = {
  id: 1,
  organization_name: "Test Organization",
  tagline: "Test Tagline",
  hero_title: "Hero Title",
  hero_subtitle: "Hero Subtitle",
  hero_background_image_url: "",
  hero_overlay_enabled: false,
  hero_overlay_color: "",
  hero_overlay_opacity: 0.5,
  cta_title: "CTA Title",
  cta_content: "CTA Content",
  cta_button_text: "Click Me",
  cta_button_url: "/action",
  campaigns_section_title: "Campaigns",
  campaigns_section_subtitle: "Our campaigns",
  show_campaigns_section: true,
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

const mockOrgInfoWithTheme: HomePage = {
  ...mockOrgInfo,
  theme: {
    logo_url: "https://example.com/logo.png",
    logo_alt_text: "Organization Logo",
  },
};

describe("PageLayout", () => {
  it("should render with title and children", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <div data-testid="page-content">Page Content</div>
      </PageLayout>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("should render with subtitle when provided", () => {
    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        subtitle="Test Subtitle"
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("should not render subtitle when not provided", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.queryByText("Test Subtitle")).not.toBeInTheDocument();
  });

  it("should display error message when error is provided", () => {
    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        error="Something went wrong"
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(
      screen.getByText("Unable to load test page at this time."),
    ).toBeInTheDocument();
  });

  it("should show detailed error in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        error="Detailed error message"
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByText("Detailed error message")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should not show detailed error in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        error="Detailed error message"
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(
      screen.queryByText("Detailed error message"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Unable to load test page at this time."),
    ).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should not display error when no error is provided", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.queryByText(/Unable to load/)).not.toBeInTheDocument();
  });

  it("should render navbar when NavbarComponent is provided", () => {
    const MockNavbar = ({
      organizationName,
      logoUrl,
      logoAltText,
      navItems,
    }: {
      organizationName?: string;
      logoUrl?: string;
      logoAltText?: string;
      navItems?: { href: string; label: string }[];
    }) => (
      <nav data-testid="navbar">
        <span>{organizationName}</span>
        {logoUrl && (
          <div data-testid="logo" data-src={logoUrl} data-alt={logoAltText}>
            Logo
          </div>
        )}
        {navItems?.map((item: { href: string; label: string }) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    );

    const navItems = [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ];

    render(
      <PageLayout
        orgInfo={mockOrgInfoWithTheme}
        title="Test Page"
        NavbarComponent={MockNavbar}
        navItems={navItems}
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByText("Test Organization")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByTestId("logo")).toHaveAttribute(
      "data-src",
      "https://example.com/logo.png",
    );
    expect(screen.getByTestId("logo")).toHaveAttribute(
      "data-alt",
      "Organization Logo",
    );
  });

  it("should not render navbar when NavbarComponent is not provided", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("should render footer when FooterComponent is provided", () => {
    const MockFooter = ({
      orgInfo,
    }: {
      orgInfo: { organization_name: string };
    }) => (
      <footer data-testid="footer">
        <span>{orgInfo.organization_name} Footer</span>
      </footer>
    );

    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        FooterComponent={MockFooter}
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByText("Test Organization Footer")).toBeInTheDocument();
  });

  it("should not render footer when FooterComponent is not provided", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("should handle navbar with theme data", () => {
    const MockNavbar = ({
      organizationName,
      logoUrl,
      logoAltText,
    }: {
      organizationName?: string;
      logoUrl?: string;
      logoAltText?: string;
    }) => (
      <nav data-testid="navbar-with-theme">
        <span>{organizationName}</span>
        {logoUrl && (
          <div data-testid="logo" data-src={logoUrl} data-alt={logoAltText}>
            Logo
          </div>
        )}
      </nav>
    );

    render(
      <PageLayout
        orgInfo={mockOrgInfoWithTheme}
        title="Test Page"
        NavbarComponent={MockNavbar}
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByTestId("navbar-with-theme")).toBeInTheDocument();
    expect(screen.getByTestId("logo")).toHaveAttribute(
      "data-src",
      "https://example.com/logo.png",
    );
    expect(screen.getByTestId("logo")).toHaveAttribute(
      "data-alt",
      "Organization Logo",
    );
  });

  it("should handle navbar without theme data", () => {
    const MockNavbar = ({
      organizationName,
      logoUrl,
      logoAltText,
    }: {
      organizationName?: string;
      logoUrl?: string;
      logoAltText?: string;
    }) => (
      <nav data-testid="navbar-no-theme">
        <span>{organizationName}</span>
        {logoUrl && (
          <div data-testid="logo" data-src={logoUrl} data-alt={logoAltText}>
            Logo
          </div>
        )}
      </nav>
    );

    render(
      <PageLayout
        orgInfo={mockOrgInfo}
        title="Test Page"
        NavbarComponent={MockNavbar}
      >
        <div>Content</div>
      </PageLayout>,
    );

    expect(screen.getByTestId("navbar-no-theme")).toBeInTheDocument();
    expect(screen.getByText("Test Organization")).toBeInTheDocument();
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument();
  });

  it("should handle empty title gracefully in error message", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="" error="Error occurred">
        <div>Content</div>
      </PageLayout>,
    );

    expect(
      screen.getByText("Unable to load content at this time."),
    ).toBeInTheDocument();
  });

  it("should render proper semantic structure", () => {
    render(
      <PageLayout orgInfo={mockOrgInfo} title="Test Page">
        <section>
          <h2>Section Title</h2>
          <p>Section content</p>
        </section>
      </PageLayout>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Test Page",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Section Title",
    );
  });
});
