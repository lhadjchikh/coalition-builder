import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout from "../layout";
// Mock the dependencies
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
jest.mock("../components/CookieConsent", () => ({
  __esModule: true,
  default: () => <div>Cookie Consent</div>,
}));
jest.mock("../../components/GoogleAnalytics", () => ({
  __esModule: true,
  default: (): null => null,
}));
jest.mock("../components/LegalDocumentTracker", () => ({
  __esModule: true,
  default: (): null => null,
}));
jest.mock("../../components/GoogleFontsLoader", () => ({
  __esModule: true,
  default: ({ googleFonts }: { googleFonts?: string[] }) => {
    if (!googleFonts || googleFonts.length === 0) return null;
    return (
      <>
        {googleFonts.map((font) => (
          <link
            key={font}
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${font}`}
          />
        ))}
      </>
    );
  },
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

  // Helper function to setup fetch mocks
  const setupFetchMock = (
    homepageData: any = mockHomepage,
    themeCSSData?: any,
    options: {
      homepageOk?: boolean;
      themeCssOk?: boolean;
      themeData?: any;
    } = {},
  ) => {
    const {
      homepageOk = true,
      themeCssOk = true,
      themeData = { google_fonts: [] },
    } = options;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/homepage/")) {
        return Promise.resolve({
          ok: homepageOk,
          json: async () => homepageData,
        });
      }
      if (url.includes("/api/themes/active/") && !url.includes("/css/")) {
        return Promise.resolve({
          ok: themeCssOk,
          json: async () => themeData,
        });
      }
      if (url.includes("/api/themes/active/css/")) {
        if (themeCSSData) {
          return Promise.resolve({
            ok: themeCssOk,
            json: async () => themeCSSData,
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedThemeStylesProps = null;
    (global.fetch as jest.Mock).mockClear();
  });

  it("should fetch and include Google Fonts in theme CSS", async () => {
    // Mock theme data with Google Fonts
    const mockThemeData = {
      google_fonts: ["Merriweather", "Barlow"],
    };

    // Mock theme CSS API response (without @import since it's stripped now)
    const mockThemeCSS = {
      css_variables: `:root {
  --theme-primary: #4A7C59;
  --theme-font-heading: 'Merriweather', serif;
  --theme-font-body: 'Barlow', sans-serif;
}`,
      custom_css: ".custom { color: red; }",
    };

    setupFetchMock(mockHomepage, mockThemeCSS, { themeData: mockThemeData });

    // Render the layout
    const Layout = await RootLayout({
      children: <div>Test Content</div>,
    });

    const { container } = render(Layout);

    // Verify fetch was called with correct endpoints
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/themes/active/",
      { cache: "no-store" },
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/themes/active/css/",
      { cache: "no-store" },
    );

    // Verify ThemeStyles received the correct props
    expect(capturedThemeStylesProps).toEqual({
      cssVariables: mockThemeCSS.css_variables,
      customCss: mockThemeCSS.custom_css,
    });

    expect(capturedThemeStylesProps.cssVariables).toContain("Merriweather");
    expect(capturedThemeStylesProps.cssVariables).toContain("Barlow");
    expect(capturedThemeStylesProps.cssVariables).toContain(
      "--theme-primary: #4A7C59",
    );
  });

  it("should handle theme CSS without Google Fonts", async () => {
    const mockThemeCSS = {
      css_variables: `:root {
  --theme-primary: #333333;
  --theme-font-heading: 'Arial', sans-serif;
}`,
      custom_css: null as string | null,
    };

    setupFetchMock(mockHomepage, mockThemeCSS);

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
    // Mock failed fetch for theme CSS
    setupFetchMock(mockHomepage);

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
