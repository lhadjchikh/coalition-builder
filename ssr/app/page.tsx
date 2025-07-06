import React from "react";
import { ssrApiClient } from "../lib/frontend-api-adapter";
import type {
  Campaign,
  HomePage as HomePageType,
  ContentBlock as ContentBlockType,
} from "@frontend/types";
import type { Metadata } from "next";
import {
  fetchHomepage,
  fetchCampaigns,
  getFallbackHomepage,
} from "@shared/utils/homepage-data";
import { generateCSSVariables } from "@shared/utils/theme";
import HomePageLayout from "@shared/components/HomePageLayout";

// Import shared components
import HeroSection from "@frontend/components/HeroSection";
import ContentBlock from "@frontend/components/ContentBlock";
import SocialLinks from "@frontend/components/SocialLinks";
import Navbar from "@frontend/components/Navbar";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await ssrApiClient.getHomepage();
    return {
      title: homepage.organization_name,
      description: homepage.tagline,
      robots: "index, follow",
      generator: "Next.js",
      applicationName: homepage.organization_name,
      authors: [{ name: homepage.organization_name + " Team" }],
    };
  } catch {
    return {
      title: "Coalition Builder",
      description: "Building strong advocacy partnerships",
      robots: "index, follow",
      generator: "Next.js",
      applicationName: "Coalition Builder",
      authors: [{ name: "Coalition Builder Team" }],
    };
  }
}

export default async function HomePage() {
  let campaigns: Campaign[] = [];
  let homepage: HomePageType | null = null;
  let homepageError: string | null = null;
  let campaignsError: string | null = null;

  // Fetch homepage and campaigns in parallel for better performance (server-side)
  const [homepageResult, campaignsResult] = await Promise.allSettled([
    ssrApiClient.getHomepage(),
    ssrApiClient.getCampaigns(),
  ]);

  // Handle homepage result
  if (homepageResult.status === "fulfilled") {
    homepage = homepageResult.value;
  } else {
    homepageError =
      homepageResult.reason instanceof Error
        ? homepageResult.reason.message
        : "Failed to fetch homepage";
    console.error("Error fetching homepage:", homepageResult.reason);
  }

  // Handle campaigns result
  if (campaignsResult.status === "fulfilled") {
    campaigns = campaignsResult.value;
  } else {
    campaignsError =
      campaignsResult.reason instanceof Error
        ? campaignsResult.reason.message
        : "Failed to fetch campaigns";
    console.error("Error fetching campaigns:", campaignsResult.reason);
  }

  const currentHomepage = homepage || getFallbackHomepage();

  // SSR navbar configuration
  const SSRNavbar: React.FC<{
    organizationName?: string;
    navItems?: Array<{
      label: string;
      href?: string;
      onClick?: () => void;
      active?: boolean;
    }>;
  }> = ({
    organizationName,
    navItems = [
      { label: "About", href: "#about-section" },
      { label: "Campaigns", href: "#campaigns-section" },
      { label: "Contact", href: "#footer" },
    ],
  }) => <Navbar organizationName={organizationName} navItems={navItems} />;

  return (
    <>
      {/* Inject theme CSS variables for SSR */}
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(currentHomepage.theme),
        }}
      />

      <HomePageLayout
        homepage={currentHomepage}
        campaigns={campaigns}
        homepageError={homepageError}
        campaignsError={campaignsError}
        HeroComponent={HeroSection}
        ContentBlockComponent={ContentBlock}
        SocialLinksComponent={SocialLinks}
        NavbarComponent={SSRNavbar}
      />
    </>
  );
}
