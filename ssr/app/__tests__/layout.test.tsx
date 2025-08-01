import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "../layout";
import { ssrApiClient } from "../../lib/api";
import { DEFAULT_NAV_ITEMS, NavItemData } from "@shared/types";

// Mock the dependencies
jest.mock("../../lib/api");
jest.mock("../../components/SSRNavbar", () => ({
  __esModule: true,
  default: ({
    organizationName,
    navItems,
  }: {
    organizationName: string;
    navItems: NavItemData[];
  }) => (
    <nav data-testid="ssr-navbar">
      <span>{organizationName}</span>
      <span>{navItems?.length || 0} nav items</span>
    </nav>
  ),
}));
jest.mock("../../components/SSRFooter", () => ({
  __esModule: true,
  default: ({ orgInfo }: { orgInfo?: { organization_name: string } }) => {
    const organizationName = orgInfo?.organization_name || "Coalition Builder";
    return (
      <footer data-testid="ssr-footer">
        <span>
          © {new Date().getFullYear()} {organizationName}. All rights reserved.
        </span>
      </footer>
    );
  },
}));
jest.mock("../../lib/registry", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@shared/components/CookieConsent", () => ({
  __esModule: true,
  default: () => <div data-testid="cookie-consent">Cookie Consent</div>,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("RootLayout", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Test tagline",
    hero_title: "Test Hero",
    hero_subtitle: "Test subtitle",
    hero_background_image_url: "",
    cta_title: "Get Involved",
    cta_content: "Test CTA",
    cta_button_text: "Join Us",
    cta_button_url: "/join",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Our Campaigns",
    campaigns_section_subtitle: "Test subtitle",
    show_campaigns_section: true,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders layout with navbar, content, and footer", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Mock fetch for layout's direct API calls
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHomepage,
        });
      }
      if (url.includes("/api/themes/active/") && !url.includes("/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ google_fonts: [] }),
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ css_variables: "", custom_css: "" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    // RootLayout returns an HTML document structure, so we need to extract the body content
    const layoutResult = await RootLayout({
      children: <div data-testid="page-content">Test Page Content</div>,
    });

    // Extract the actual content from the body element
    const bodyElement = layoutResult.props.children[1]; // [0] is head, [1] is body
    const bodyChildren = bodyElement.props.children; // This is the StyledComponentsRegistry
    const { container } = render(bodyChildren);

    // Check for navbar
    const navbar = screen.getByTestId("ssr-navbar");
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveTextContent("Test Organization");
    expect(navbar).toHaveTextContent("4 nav items");

    // Check for main content
    const mainContent = screen.getByTestId("page-content");
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveTextContent("Test Page Content");

    // Check for footer
    const footer = screen.getByTestId("ssr-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(
      `© ${new Date().getFullYear()} Test Organization. All rights reserved.`,
    );

    // Check for cookie consent
    const cookieConsent = screen.getByTestId("cookie-consent");
    expect(cookieConsent).toBeInTheDocument();

    // Check layout structure
    const appRoot = container.querySelector("#app-root");
    expect(appRoot).toBeInTheDocument();
    expect(appRoot).toHaveStyle({
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    });

    // Check main element has flex: 1
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ flex: "1" });
  });

  it("uses fallback data when homepage fetch fails", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockRejectedValue(
      new Error("API Error"),
    );

    // Mock fetch to fail for homepage
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const layoutResult = await RootLayout({
      children: <div>Test Content</div>,
    });
    const bodyElement = layoutResult.props.children[1];
    const bodyChildren = bodyElement.props.children;
    render(bodyChildren);

    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching homepage for layout:",
      "HTTP error! status: 500",
    );

    // Should still render with fallback organization name
    const navbar = screen.getByTestId("ssr-navbar");
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveTextContent("Coalition Builder");
    expect(navbar).toHaveTextContent(`${DEFAULT_NAV_ITEMS.length} nav items`);

    const footer = screen.getByTestId("ssr-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent("Coalition Builder");

    consoleSpy.mockRestore();
  });

  it("handles empty nav items", async () => {
    const homepageWithoutNavItems = {
      ...mockHomepage,
      nav_items: [] as NavItemData[],
    };
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(
      homepageWithoutNavItems,
    );

    // Mock fetch for layout's direct API calls
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => homepageWithoutNavItems,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ css_variables: "", custom_css: "" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const layoutResult = await RootLayout({
      children: <div>Test Content</div>,
    });
    const bodyElement = layoutResult.props.children[1];
    const bodyChildren = bodyElement.props.children;
    render(bodyChildren);

    const navbar = screen.getByTestId("ssr-navbar");
    // Empty nav_items should use DEFAULT_NAV_ITEMS
    expect(navbar).toHaveTextContent(`${DEFAULT_NAV_ITEMS.length} nav items`);
  });

  it("handles null nav items", async () => {
    const homepageWithNullNavItems = {
      ...mockHomepage,
      nav_items: null as NavItemData[] | null,
    };
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(
      homepageWithNullNavItems,
    );

    // Mock fetch for layout's direct API calls
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => homepageWithNullNavItems,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ css_variables: "", custom_css: "" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const layoutResult = await RootLayout({
      children: <div>Test Content</div>,
    });
    const bodyElement = layoutResult.props.children[1];
    const bodyChildren = bodyElement.props.children;
    render(bodyChildren);

    // Should use default nav items
    const navbar = screen.getByTestId("ssr-navbar");
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveTextContent(`${DEFAULT_NAV_ITEMS.length} nav items`);
  });

  it("maintains SSR data attribute", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Mock fetch for layout's direct API calls
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHomepage,
        });
      }
      if (url.includes("/api/themes/active/") && !url.includes("/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ google_fonts: [] }),
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ css_variables: "", custom_css: "" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const layoutResult = await RootLayout({
      children: <div>Test Content</div>,
    });
    const bodyElement = layoutResult.props.children[1];
    const bodyChildren = bodyElement.props.children;
    const { container } = render(bodyChildren);

    const appRoot = container.querySelector('[data-ssr="true"]');
    expect(appRoot).toBeInTheDocument();
  });
});
