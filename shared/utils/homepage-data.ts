// Shared homepage data fetching and fallback logic
import { NavItemData, HomePage, Campaign } from "../types";

export function getFallbackHomepage(): HomePage {
  return {
    id: 0,
    organization_name:
      process.env.NEXT_PUBLIC_ORGANIZATION_NAME ||
      process.env.ORGANIZATION_NAME ||
      "Coalition Builder",
    tagline:
      process.env.NEXT_PUBLIC_TAGLINE ||
      process.env.TAGLINE ||
      "Building strong advocacy partnerships",
    hero_title: "Welcome to Coalition Builder",
    hero_subtitle: "Empowering advocates to build strong policy coalitions",
    hero_background_image_url: "",
    hero_overlay_enabled: true,
    hero_overlay_color: "#000000",
    hero_overlay_opacity: 0.4,
    cta_title: "Get Involved",
    cta_content: "Join our coalition and help make a difference.",
    cta_button_text: "Learn More",
    cta_button_url: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Policy Campaigns",
    campaigns_section_subtitle: "",
    show_campaigns_section: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// API URL resolution for different environments
export function getApiUrl(): string {
  // SSR environment
  if (typeof window === "undefined") {
    return (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000"
    );
  }

  // Client environment
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:8000"
  );
}

// Shared API functions
export async function fetchHomepage(): Promise<HomePage> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/homepage/`, {
    // Add cache control for Next.js SSR
    next: { revalidate: 300 }, // 5 minutes
  } as any);

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status}`);
  }

  return response.json();
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/campaigns/`, {
    // Add cache control for Next.js SSR
    next: { revalidate: 300 }, // 5 minutes
  } as any);

  if (!response.ok) {
    throw new Error(`Failed to fetch campaigns: ${response.status}`);
  }

  return response.json();
}
