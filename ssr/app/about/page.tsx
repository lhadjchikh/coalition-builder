import React from "react";
import { ssrApiClient } from "../../lib/api";
import type { Metadata } from "next";
import type { HomePage, ContentBlock as ContentBlockType } from "@shared/types";
import { generateCSSVariables } from "@shared/utils/theme";
import { getFallbackHomepage } from "@shared/utils/homepage-data";
import AboutPage from "@shared/components/AboutPage";
import ContentBlock from "@shared/components/ContentBlock";
import SSRNavbar from "../../lib/components/SSRNavbar";
import SSRFooter from "../../lib/components/SSRFooter";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await ssrApiClient.getHomepage();
    return {
      title: `About - ${homepage.organization_name}`,
      description: `Learn about ${homepage.organization_name} and our mission`,
      robots: "index, follow",
      generator: "Next.js",
      applicationName: homepage.organization_name,
      authors: [{ name: homepage.organization_name + " Team" }],
    };
  } catch {
    return {
      title: "About - Coalition Builder",
      description: "Learn about our mission and goals",
      robots: "index, follow",
      generator: "Next.js",
      applicationName: "Coalition Builder",
      authors: [{ name: "Coalition Builder Team" }],
    };
  }
}

export default async function AboutPageSSR() {
  let homepage: HomePage | null = null;
  let contentBlocks: ContentBlockType[] = [];
  let error: string | null = null;

  try {
    homepage = await ssrApiClient.getHomepage();
  } catch (err) {
    console.error("Error fetching homepage:", err);
    homepage = getFallbackHomepage();
  }

  try {
    contentBlocks = await ssrApiClient.getContentBlocks("about");
  } catch (err) {
    console.error("Error fetching about content blocks:", err);
    error = err instanceof Error ? err.message : "Failed to fetch content";
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(homepage.theme),
        }}
      />
      <AboutPage
        orgInfo={homepage}
        contentBlocks={contentBlocks}
        error={error}
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
