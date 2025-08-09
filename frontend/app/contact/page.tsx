import React from "react";
import { ssrApiClient } from "../../lib/api";
import type { Metadata } from "next";
import type { HomePage, ContentBlock as ContentBlockType } from "../../types";
import { generateCSSVariables } from "../../utils/theme";
import { getFallbackHomepage } from "../../utils/homepage-data";
import ContactPage from "../../components/ContactPage";
import ContentBlock from "../../components/ContentBlock";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await ssrApiClient.getHomepage();
    return {
      title: `Contact - ${homepage.organization_name}`,
      description: `Get in touch with ${homepage.organization_name}`,
      robots: "index, follow",
      generator: "Next.js",
      applicationName: homepage.organization_name,
      authors: [{ name: homepage.organization_name + " Team" }],
    };
  } catch {
    return {
      title: "Contact - Coalition Builder",
      description: "Get in touch with us",
      robots: "index, follow",
      generator: "Next.js",
      applicationName: "Coalition Builder",
      authors: [{ name: "Coalition Builder Team" }],
    };
  }
}

export default async function ContactPageSSR() {
  let homepage: HomePage | null = null;
  let contentBlocks: ContentBlockType[] = [];
  let error: string | null = null;

  try {
    homepage = await ssrApiClient.getHomepage();
  } catch (err) {
    console.error(
      "Error fetching homepage:",
      err instanceof Error ? err.message : "Unknown error"
    );
    homepage = getFallbackHomepage();
  }

  try {
    contentBlocks = await ssrApiClient.getContentBlocksByPageType("contact");
  } catch (err) {
    console.error(
      "Error fetching contact content blocks:",
      err instanceof Error ? err.message : "Unknown error"
    );
    error = err instanceof Error ? err.message : "Failed to fetch content";
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(homepage.theme),
        }}
      />
      <ContactPage
        orgInfo={homepage}
        contentBlocks={contentBlocks}
        error={error}
        ContentBlockComponent={ContentBlock}
      />
    </>
  );
}
