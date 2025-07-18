import type { Metadata, Viewport } from "next";
import "./globals.css";
import StyledComponentsRegistry from "../lib/registry";
import SSRNavbar from "../components/SSRNavbar";
import SSRFooter from "../components/SSRFooter";
import CookieConsent from "@shared/components/CookieConsent";
import GoogleAnalytics from "../components/GoogleAnalytics";
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

  try {
    homepage = await ssrApiClient.getHomepage();
    organizationName = homepage.organization_name;
  } catch (error) {
    console.error("Error fetching homepage for layout:", error);
    const fallbackHomepage = getFallbackHomepage();
    organizationName = fallbackHomepage.organization_name;
    homepage = fallbackHomepage;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The head tag is optional in Next.js App Router,
            but we include it explicitly to ensure it's present for SSR tests */}
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
