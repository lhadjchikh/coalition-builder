import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PersonProfilePage from "../../../components/PersonProfilePage";
import { ssrApiClient } from "../../../lib/api";
import { ApiRequestError } from "../../../services/api-client";
import type { HomePage, PersonDetail } from "../../../types";
import { getFallbackHomepage } from "../../../utils/homepage-data";
import { generateCSSVariables } from "../../../utils/theme";

interface ProfileRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProfileRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const [homepageState, personState] = await Promise.allSettled([
    ssrApiClient.getHomepage(),
    ssrApiClient.getPerson(slug),
  ]);
  if (
    homepageState.status === "rejected" ||
    personState.status === "rejected"
  ) {
    return {
      title: "Team Profile - Coalition Builder",
      robots: "noindex, nofollow",
    };
  }

  return {
    title: `${personState.value.name} - ${homepageState.value.organization_name}`,
    description: `${personState.value.title} at ${homepageState.value.organization_name}`,
  };
}

export default async function ProfileRoute({ params }: ProfileRouteProps) {
  const { slug } = await params;
  const [homepageState, personState] = await Promise.allSettled([
    ssrApiClient.getHomepage(),
    ssrApiClient.getPerson(slug),
  ]);
  const homepage: HomePage =
    homepageState.status === "fulfilled"
      ? homepageState.value
      : getFallbackHomepage();

  if (homepageState.status === "rejected") {
    console.error("Error fetching homepage:", homepageState.reason);
  }
  if (
    personState.status === "rejected" &&
    personState.reason instanceof ApiRequestError &&
    personState.reason.status === 404
  ) {
    notFound();
  }

  let person: PersonDetail | null = null;
  let error: string | null = null;
  if (personState.status === "fulfilled") {
    person = personState.value;
  } else {
    console.error("Error fetching person profile:", personState.reason);
    error =
      personState.reason instanceof Error
        ? personState.reason.message
        : "Failed to fetch person profile";
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: generateCSSVariables(homepage.theme ?? null),
        }}
      />
      <PersonProfilePage orgInfo={homepage} person={person} error={error} />
    </>
  );
}
