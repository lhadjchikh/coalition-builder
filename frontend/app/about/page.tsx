import React from "react";
import { ssrApiClient } from "../../lib/api";
import type { Metadata } from "next";
import type { HomePage, ContentBlock as ContentBlockType } from "../../types";
import { generateCSSVariables } from "../../utils/theme";
import { getFallbackHomepage } from "../../utils/homepage-data";
import AboutPage from "./AboutPage";
import ContentBlock from "./ContentBlock";

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
    contentBlocks = await ssrApiClient.getContentBlocksByPageType("about");
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
      />
    </>
  );
}
