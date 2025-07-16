import React from "react";
import { ssrApiClient } from "../../lib/frontend-api-adapter";
import type { Metadata } from "next";
import type { HomePage, ContentBlock as ContentBlockType } from "@shared/types";
import { generateCSSVariables } from "@shared/utils/theme";
import { getFallbackHomepage } from "@shared/utils/homepage-data";
import ContactPage from "@shared/components/ContactPage";
import ContentBlock from "@shared/components/ContentBlock";
import SocialLinks from "@shared/components/SocialLinks";
import SSRNavbar from "../../lib/components/SSRNavbar";
import SSRFooter from "../../lib/components/SSRFooter";

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
    console.error("Error fetching homepage:", err);
    homepage = getFallbackHomepage();
  }

  try {
    contentBlocks = await ssrApiClient.getContentBlocks("contact");
  } catch (err) {
    console.error("Error fetching contact content blocks:", err);
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
        homepage={homepage}
        contentBlocks={contentBlocks}
        error={error}
        ContentBlockComponent={ContentBlock}
        SocialLinksComponent={SocialLinks}
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
