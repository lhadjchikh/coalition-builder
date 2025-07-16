import type { Metadata, Viewport } from "next";
import "./globals.css";
import StyledComponentsRegistry from "../lib/registry";
import SSRNavbar from "../lib/components/SSRNavbar";
import SSRFooter from "../lib/components/SSRFooter";
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
  let navItems: NavItemData[] = DEFAULT_NAV_ITEMS;
  let homepage = null;

  try {
    homepage = await ssrApiClient.getHomepage();
    organizationName = homepage.organization_name;

    // Use custom nav items if provided, otherwise use defaults
    if (homepage.nav_items && homepage.nav_items.length > 0) {
      navItems = homepage.nav_items;
    }
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
              navItems={navItems}
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
