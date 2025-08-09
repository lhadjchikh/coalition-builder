import React from "react";
import { ssrApiClient } from "../lib/api";
import type {
  Campaign,
  HomePage as HomePageType,
  ContentBlock,
} from "../types";
import type { Metadata } from "next";
import { getFallbackHomepage } from "../utils/homepage-data";
import { generateCSSVariables } from "../utils/theme";
import HomePageComponent from "../components/HomePage";
import { fetchApiResource } from "../lib/utils/api";

// Import shared components
import HeroSection from "../components/HeroSection";
import ContentBlockComponent from "../components/ContentBlock";
import SocialLinks from "../components/SocialLinks";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:8000"}/api/homepage/`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let homepage;
    try {
      homepage = await response.json();
    } catch (error) {
      throw new Error("Failed to parse JSON response");
    }
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
      fetchApiResource<HomePageType>(
        `${baseUrl}/api/homepage/`,
        fetchOptions,
        "homepage",
      ),
      fetchApiResource<Campaign[]>(
        `${baseUrl}/api/campaigns/`,
        fetchOptions,
        "campaigns",
      ),
      fetchApiResource<ContentBlock[]>(
        `${baseUrl}/api/content-blocks/?page_type=homepage`,
        fetchOptions,
        "content blocks",
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
