import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "../layout";
import { ssrApiClient } from "../../lib/api";

// Mock the dependencies
jest.mock("../../lib/api");
jest.mock("../../components/SSRNavbar", () => ({
  __esModule: true,
  default: () => <nav>SSR Navbar</nav>,
}));
jest.mock("../../components/SSRFooter", () => ({
  __esModule: true,
  default: () => <footer>SSR Footer</footer>,
}));
jest.mock("../../lib/registry", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@shared/components/CookieConsent", () => ({
  __esModule: true,
  default: () => <div>Cookie Consent</div>,
}));
jest.mock("../../components/GoogleAnalytics", () => ({
  __esModule: true,
  default: (): null => null,
}));
jest.mock("@shared/components/LegalDocumentTracker", () => ({
  __esModule: true,
  default: (): null => null,
}));

// Mock ThemeStyles to capture its props
let capturedThemeStylesProps: any = null;
jest.mock("../../components/ThemeStyles", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedThemeStylesProps = props;
    return (
      <>
        {props.cssVariables && (
          <style dangerouslySetInnerHTML={{ __html: props.cssVariables }} />
        )}
        {props.customCss && (
          <style dangerouslySetInnerHTML={{ __html: props.customCss }} />
        )}
      </>
    );
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("Theme CSS Loading", () => {
  const mockHomepage = {
    id: 1,
    organization_name: "Test Organization",
    tagline: "Test tagline",
    hero_title: "Welcome",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedThemeStylesProps = null;
    (global.fetch as jest.Mock).mockClear();
  });

  it("should fetch and include Google Fonts in theme CSS", async () => {
    // Mock homepage API response
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Mock theme CSS API response with Google Fonts
    const mockThemeCSS = {
      css_variables: `@import url("https://fonts.googleapis.com/css2?family=Merriweather:400,500,600,700&family=Barlow:400,500,600,700&display=swap");
:root {
  --theme-primary: #4A7C59;
  --theme-font-heading: 'Merriweather', serif;
  --theme-font-body: 'Barlow', sans-serif;
}`,
      custom_css: ".custom { color: red; }",
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHomepage,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThemeCSS,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    // Render the layout
    const Layout = await RootLayout({
      children: <div>Test Content</div>,
    });

    const { container } = render(Layout);

    // Verify fetch was called with correct endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/themes/active/css/",
      { cache: "no-store" },
    );

    // Verify ThemeStyles received the correct props
    expect(capturedThemeStylesProps).toEqual({
      cssVariables: mockThemeCSS.css_variables,
      customCss: mockThemeCSS.custom_css,
    });

    // The test already verifies that ThemeStyles received the correct props
    // We can check that the CSS includes Google Fonts import
    expect(capturedThemeStylesProps.cssVariables).toContain("@import url(");
    expect(capturedThemeStylesProps.cssVariables).toContain(
      "https://fonts.googleapis.com/css2?",
    );
    expect(capturedThemeStylesProps.cssVariables).toContain("Merriweather");
    expect(capturedThemeStylesProps.cssVariables).toContain("Barlow");
    expect(capturedThemeStylesProps.cssVariables).toContain(
      "--theme-primary: #4A7C59",
    );
  });

  it("should handle theme CSS without Google Fonts", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    const mockThemeCSS = {
      css_variables: `:root {
  --theme-primary: #333333;
  --theme-font-heading: 'Arial', sans-serif;
}`,
      custom_css: null as string | null,
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHomepage,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThemeCSS,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const Layout = await RootLayout({
      children: <div>Test Content</div>,
    });

    render(Layout);

    // Verify that ThemeStyles received CSS without Google Fonts
    expect(capturedThemeStylesProps.cssVariables).not.toContain("@import url(");
    expect(capturedThemeStylesProps.cssVariables).not.toContain(
      "https://fonts.googleapis.com/css2?",
    );
  });

  it("should handle failed theme CSS fetch gracefully", async () => {
    (ssrApiClient.getHomepage as jest.Mock).mockResolvedValue(mockHomepage);

    // Mock failed fetch
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHomepage,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const Layout = await RootLayout({
      children: <div>Test Content</div>,
    });

    const { container } = render(Layout);

    // Should render without crashing
    expect(container).toBeTruthy();

    // Should use default empty theme styles
    expect(capturedThemeStylesProps).toEqual({
      cssVariables: "",
      customCss: "",
    });

    consoleErrorSpy.mockRestore();
  });
});
