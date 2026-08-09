import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContentBlock from "../../components/ContentBlock";
import TeamPage from "../../components/TeamPage";
import { ssrApiClient } from "../../lib/api";
import type {
  ContentBlock as ContentBlockType,
  HomePage,
  PersonGroup,
} from "../../types";
import { getFallbackHomepage } from "../../utils/homepage-data";
import { generateCSSVariables } from "../../utils/theme";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const homepage = await ssrApiClient.getHomepage();
    return {
      title: `Our Team - ${homepage.organization_name}`,
      description: `Meet the people behind ${homepage.organization_name}`,
    };
  } catch {
    return {
      title: "Our Team - Coalition Builder",
      description: "Meet the people behind our coalition",
    };
  }
}

export default async function TeamRoute() {
  const [homepageState, groupsState, blocksState] = await Promise.allSettled([
    ssrApiClient.getHomepage(),
    ssrApiClient.getPeople(),
    ssrApiClient.getContentBlocksByPageType("team"),
  ]);

  const homepage: HomePage =
    homepageState.status === "fulfilled"
      ? homepageState.value
      : getFallbackHomepage();
  const groups: PersonGroup[] =
    groupsState.status === "fulfilled" ? groupsState.value : [];
  const contentBlocks: ContentBlockType[] =
    blocksState.status === "fulfilled" ? blocksState.value : [];

  if (homepageState.status === "rejected") {
    console.error("Error fetching homepage:", homepageState.reason);
  }
  if (groupsState.status === "rejected") {
    console.error("Error fetching people:", groupsState.reason);
  }
  if (blocksState.status === "rejected") {
    console.error("Error fetching team content blocks:", blocksState.reason);
  }

  if (groupsState.status === "fulfilled" && groups.length === 0) {
    notFound();
  }

  const errorState =
    groupsState.status === "rejected"
      ? groupsState.reason
      : blocksState.status === "rejected"
        ? blocksState.reason
        : null;
  const error =
    errorState instanceof Error
      ? errorState.message
      : errorState
        ? "Failed to fetch team content"
        : null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(homepage.theme ?? null),
        }}
      />
      <TeamPage
        orgInfo={homepage}
        groups={groups}
        contentBlocks={contentBlocks}
        error={error}
        ContentBlockComponent={ContentBlock}
      />
    </>
  );
}
