import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@shared/styles/content-animations.css";
import StyledComponentsRegistry from "../lib/registry";
import SSRNavbar from "../components/SSRNavbar";
import SSRFooter from "../components/SSRFooter";
import CookieConsent from "@shared/components/CookieConsent";
import GoogleAnalytics from "../components/GoogleAnalytics";
import ThemeStyles from "../components/ThemeStyles";
import { ssrApiClient } from "../lib/api";
import { NavItemData, DEFAULT_NAV_ITEMS } from "@shared/types";
import { getFallbackHomepage } from "@shared/utils/homepage-data";

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

  try {
    homepage = await ssrApiClient.getHomepage();
    organizationName = homepage.organization_name;
  } catch (error) {
    console.error(
      "Error fetching homepage for layout:",
      error instanceof Error ? error.message : "Unknown error",
    );
    const fallbackHomepage = getFallbackHomepage();
    organizationName = fallbackHomepage.organization_name;
    homepage = fallbackHomepage;
  }

  // Fetch theme CSS
  try {
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:8000"}/api/theme/current/css/`,
    );
    if (response.ok) {
      const data = await response.json();
      themeStyles = {
        cssVariables: data.css_variables || "",
        customCss: data.custom_css || "",
      };
    }
  } catch (error) {
    console.error(
      "Error fetching theme CSS:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The head tag is optional in Next.js App Router,
            but we include it explicitly to ensure it's present for SSR tests */}
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
