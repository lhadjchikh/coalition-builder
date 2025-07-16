import React from "react";
import { ssrApiClient } from "../../lib/api";
import type { Metadata } from "next";
import type {
  HomePage,
  Campaign,
  ContentBlock as ContentBlockType,
} from "@shared/types";
import { generateCSSVariables } from "@shared/utils/theme";
import { getFallbackHomepage } from "@shared/utils/homepage-data";
import CampaignsPage from "@shared/components/CampaignsPage";
import ContentBlock from "@shared/components/ContentBlock";
import SSRNavbar from "../../lib/components/SSRNavbar";
import SSRFooter from "../../lib/components/SSRFooter";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await ssrApiClient.getHomepage();
    return {
      title: `Campaigns - ${homepage.organization_name}`,
      description: `Browse policy campaigns from ${homepage.organization_name}`,
      robots: "index, follow",
      generator: "Next.js",
      applicationName: homepage.organization_name,
      authors: [{ name: homepage.organization_name + " Team" }],
    };
  } catch {
    return {
      title: "Campaigns - Coalition Builder",
      description: "Browse our policy campaigns",
      robots: "index, follow",
      generator: "Next.js",
      applicationName: "Coalition Builder",
      authors: [{ name: "Coalition Builder Team" }],
    };
  }
}

export default async function CampaignsPageSSR() {
  let homepage: HomePage | null = null;
  let campaigns: Campaign[] = [];
  let contentBlocks: ContentBlockType[] = [];
  let campaignsError: string | null = null;
  let contentError: string | null = null;

  try {
    homepage = await ssrApiClient.getHomepage();
  } catch (err) {
    console.error("Error fetching homepage:", err);
    homepage = getFallbackHomepage();
  }

  try {
    campaigns = await ssrApiClient.getCampaigns();
  } catch (err) {
    console.error("Error fetching campaigns:", err);
    campaignsError =
      err instanceof Error ? err.message : "Failed to fetch campaigns";
  }

  try {
    contentBlocks = await ssrApiClient.getContentBlocks("campaigns");
  } catch (err) {
    console.error("Error fetching campaigns content blocks:", err);
    contentError =
      err instanceof Error ? err.message : "Failed to fetch content";
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(homepage.theme),
        }}
      />
      <CampaignsPage
        homepage={homepage}
        campaigns={campaigns}
        contentBlocks={contentBlocks}
        campaignsError={campaignsError}
        contentError={contentError}
        ContentBlockComponent={ContentBlock}
        NavbarComponent={SSRNavbar}
        FooterComponent={SSRFooter}
        navItems={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Campaigns", href: "/campaigns" },
          { label: "Contact", href: "/contact" },
        ]}
      />
    </>
  );
}
