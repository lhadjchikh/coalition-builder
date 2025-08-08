import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/content-animations.css";
import "../styles/campaign-animations.css";
import StyledComponentsRegistry from "../lib/registry";
import SSRNavbar from "../../components/SSRNavbar";
import SSRFooter from "../../components/SSRFooter";
import CookieConsent from "./CookieConsent";
import GoogleAnalytics from "../../components/GoogleAnalytics";
import ThemeStyles from "../../components/ThemeStyles";
import GoogleFontsLoader from "../../components/GoogleFontsLoader";
import { ssrApiClient } from "../lib/api";
import { NavItemData, DEFAULT_NAV_ITEMS } from "../../types";
import { getFallbackHomepage } from "../../utils/homepage-data";

const org = process.env.ORGANIZATION_NAME || "Coalition Builder";

export const metadata: Metadata = {
  title: org,
  description: process.env.TAGLINE || "Building strong advocacy partnerships",
  robots: "index, follow",
  generator: "Next.js",
  applicationName: org,
  authors: [{ name: org + " Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch homepage data for navbar and footer
  let organizationName = "";
  let homepage = null;
  let themeStyles = { cssVariables: "", customCss: "" };
  let googleFonts: string[] = [];

  try {
    // Fetch homepage data without caching for layout
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:8000"}/api/homepage/`,
      {
        cache: "no-store", // Disable caching for layout data
      },
    );
    if (response.ok) {
      homepage = await response.json();
      organizationName = homepage.organization_name;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(
      "Error fetching homepage for layout:",
      error instanceof Error ? error.message : "Unknown error",
    );
    const fallbackHomepage = getFallbackHomepage();
    organizationName = fallbackHomepage.organization_name;
    homepage = fallbackHomepage;
  }

  // Fetch theme data
  try {
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:8000"}/api/themes/active/`,
      {
        cache: "no-store", // Disable caching for theme data
      },
    );
    if (response.ok) {
      const theme = await response.json();
      googleFonts = theme.google_fonts || [];

      // Generate CSS without @import statements
      const cssResponse = await fetch(
        `${process.env.API_URL || "http://localhost:8000"}/api/themes/active/css/`,
        {
          cache: "no-store",
        },
      );
      if (cssResponse.ok) {
        const data = await cssResponse.json();
        // Remove @import statements from css_variables
        let cssVariables = data.css_variables || "";
        cssVariables = cssVariables.replace(/@import[^;]+;/g, "").trim();

        themeStyles = {
          cssVariables,
          customCss: data.custom_css || "",
        };
      }
    }
  } catch (error) {
    console.error(
      "Error fetching theme data:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The head tag is optional in Next.js App Router,
            but we include it explicitly to ensure it's present for SSR tests */}
        {homepage?.theme?.favicon_url && (
          <link rel="icon" href={homepage.theme.favicon_url} />
        )}
        <GoogleFontsLoader googleFonts={googleFonts} />
        <ThemeStyles
          cssVariables={themeStyles.cssVariables}
          customCss={themeStyles.customCss}
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <div
            data-ssr="true"
            id="app-root"
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SSRNavbar
              organizationName={organizationName}
              logoUrl={homepage?.theme?.logo_url}
              logoAltText={homepage?.theme?.logo_alt_text}
              navItems={DEFAULT_NAV_ITEMS}
            />
            <main style={{ flex: 1 }}>{children}</main>
            <SSRFooter orgInfo={homepage} />
          </div>
          <CookieConsent />
          <GoogleAnalytics />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
