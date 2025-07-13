// Shared homepage data fetching and fallback logic
import { NavItemData } from "../types";

export interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  endorsement_statement?: string;
  allow_endorsements?: boolean;
  endorsement_form_instructions?: string;
  active: boolean;
  created_at: string;
}

export interface HomePage {
  id: number;
  organization_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image: string;
  about_section_title: string;
  about_section_content: string;
  cta_title: string;
  cta_content: string;
  cta_button_text: string;
  cta_button_url: string;
  contact_email: string;
  contact_phone: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  campaigns_section_title: string;
  campaigns_section_subtitle: string;
  show_campaigns_section: boolean;
  content_blocks: any[];
  nav_items?: NavItemData[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  theme?: any;
}

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
    hero_background_image: "",
    about_section_title: "About Our Mission",
    about_section_content:
      "We believe in the power of collective action to drive meaningful policy change.",
    cta_title: "Get Involved",
    cta_content: "Join our coalition and help make a difference.",
    cta_button_text: "Learn More",
    cta_button_url: "",
    contact_email: "info@example.org",
    contact_phone: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    campaigns_section_title: "Policy Campaigns",
    campaigns_section_subtitle: "",
    show_campaigns_section: true,
    content_blocks: [],
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
    next: { revalidate: 60 }, // Revalidate every minute for Next.js
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage: ${response.status}`);
  }

  return response.json();
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/campaigns/`, {
    next: { revalidate: 300 }, // Revalidate every 5 minutes for Next.js
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch campaigns: ${response.status}`);
  }

  return response.json();
}
