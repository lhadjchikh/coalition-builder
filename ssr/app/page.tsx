import React from "react";
import { ssrApiClient } from "../lib/api";
import type {
  Campaign,
  HomePage as HomePageType,
  ContentBlock,
} from "@shared/types";
import type { Metadata } from "next";
import { getFallbackHomepage } from "@shared/utils/homepage-data";
import { generateCSSVariables } from "@shared/utils/theme";
import HomePageComponent from "@shared/components/HomePage";

// Import shared components
import HeroSection from "@shared/components/HeroSection";
import ContentBlockComponent from "@shared/components/ContentBlock";
import SocialLinks from "@shared/components/SocialLinks";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:8000"}/api/homepage/`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const homepage = await response.json();
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
  let contentBlocks: ContentBlock[] = [];
  let homepageError: string | null = null;
  let campaignsError: string | null = null;

  // Fetch homepage, campaigns, and content blocks in parallel for better performance (server-side)
  // Note: Homepage is also fetched in layout.tsx for nav/footer. Next.js App Router
  // automatically deduplicates identical requests within the same render cycle.
  const baseUrl = process.env.API_URL || "http://localhost:8000";
  const fetchOptions = { cache: "no-store" as const };

  const [homepageResult, campaignsResult, contentBlocksResult] =
    await Promise.allSettled([
      fetch(`${baseUrl}/api/homepage/`, fetchOptions).then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(
              new Error(`Failed to fetch homepage: HTTP ${r.status}`),
            ),
      ),
      fetch(`${baseUrl}/api/campaigns/`, fetchOptions).then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(
              new Error(`Failed to fetch campaigns: HTTP ${r.status}`),
            ),
      ),
      fetch(
        `${baseUrl}/api/content-blocks/?page_type=homepage`,
        fetchOptions,
      ).then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(
              new Error(`Failed to fetch content blocks: HTTP ${r.status}`),
            ),
      ),
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

  // Handle content blocks result
  if (contentBlocksResult.status === "fulfilled") {
    contentBlocks = contentBlocksResult.value;
  } else {
    console.error(
      "Error fetching homepage content blocks:",
      contentBlocksResult.reason,
    );
  }

  const currentHomepage = homepage || getFallbackHomepage();

  return (
    <>
      {/* Inject theme CSS variables for SSR */}
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(currentHomepage.theme),
        }}
      />

      <HomePageComponent
        homepage={currentHomepage}
        campaigns={campaigns}
        homepageError={homepageError}
        campaignsError={campaignsError}
        HeroComponent={HeroSection}
        ContentBlockComponent={ContentBlockComponent}
        SocialLinksComponent={SocialLinks}
        contentBlocks={contentBlocks}
      />
    </>
  );
}
