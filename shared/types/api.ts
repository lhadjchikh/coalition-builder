/**
 * Shared API types used across frontend and SSR
 * This ensures consistency between client and server-side code
 */

// Campaign type definition
export interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  image_url?: string;
  image_alt_text?: string;
  image_author?: string;
  image_license?: string;
  image_source_url?: string;
  endorsement_statement?: string;
  allow_endorsements?: boolean;
  endorsement_form_instructions?: string;
  active?: boolean;
  created_at?: string;
}

// Endorser type definition (matches StakeholderOut schema)
export interface Endorser {
  id: number;
  name?: string; // Computed property for backward compatibility
  first_name: string;
  last_name: string;
  organization?: string;
  role?: string;
  email: string;
  street_address?: string;
  city?: string;
  state: string;
  zip_code?: string;
  county?: string;
  type:
    | "farmer"
    | "waterman"
    | "business"
    | "nonprofit"
    | "individual"
    | "government"
    | "other";
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  congressional_district_name?: string;
  congressional_district_abbrev?: string;
  state_senate_district_name?: string;
  state_senate_district_abbrev?: string;
  state_house_district_name?: string;
  state_house_district_abbrev?: string;
}

// Legislator type definition (matches LegislatorOut schema)
export interface Legislator {
  id: number;
  first_name: string;
  last_name: string;
  chamber: string;
  state: string;
  district?: string;
  is_senior?: boolean;
}

// Stakeholder type definition (for endorsements)
export interface Stakeholder {
  id?: number;
  name?: string; // Computed property for backward compatibility
  first_name: string;
  last_name: string;
  organization?: string;
  role?: string;
  email: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  type:
    | "farmer"
    | "waterman"
    | "business"
    | "nonprofit"
    | "individual"
    | "government"
    | "other";
  email_updates?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Endorsement type definition
export interface Endorsement {
  id: number;
  stakeholder: Stakeholder;
  campaign: Campaign;
  statement?: string;
  public_display: boolean;
  created_at: string;
}

// Spam prevention form metadata interface
export interface SpamPreventionMetadata {
  // Timing validation
  form_start_time?: string; // ISO timestamp when form was loaded

  // Honeypot fields (should remain empty for legitimate users)
  website?: string;
  url?: string;
  homepage?: string;
  confirm_email?: string;

  // Additional metadata for spam detection
  referrer?: string; // Page referrer for analytics
}

// For creating new endorsements
export interface EndorsementCreate {
  campaign_id: number;
  stakeholder: Omit<Stakeholder, "id" | "created_at" | "updated_at" | "name">;
  statement?: string;
  public_display: boolean;
  terms_accepted: boolean;
  org_authorized: boolean;
  form_metadata?: SpamPreventionMetadata; // For spam prevention
}

// Theme and styling types
export interface Theme {
  id: number;
  name: string;
  description?: string;

  // Brand colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;

  // Background colors
  background_color: string;
  section_background_color: string;
  card_background_color: string;

  // Text colors
  heading_color: string;
  body_text_color: string;
  muted_text_color: string;
  link_color: string;
  link_hover_color: string;

  // Typography
  heading_font_family: string;
  body_font_family: string;
  google_fonts: string[];
  font_size_base: number;
  font_size_small: number;
  font_size_large: number;

  // Brand assets
  logo_url?: string;
  logo_alt_text?: string;
  favicon_url?: string;

  // Custom CSS
  custom_css?: string;

  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Video type definition
export interface Video {
  id: number;
  title: string;
  alt_text: string;
  description?: string;
  author?: string;
  license?: string;
  source_url?: string;
  video_type: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  show_controls: boolean;
  video_url: string;
  created_at: string;
  updated_at: string;
}

// Content management types
export interface ContentBlock {
  id: number;
  title?: string; // Made optional to match backend model
  block_type: string;
  page_type: string; // Added to match the refactored backend model
  content: string;
  image_url?: string;
  image_alt_text?: string;
  image_title?: string;
  image_author?: string;
  image_license?: string;
  image_source_url?: string;
  layout_option?: string; // Layout arrangement for Text + Image blocks
  vertical_alignment?: string; // Vertical alignment of text relative to image
  css_classes?: string;
  background_color?: string;
  animation_type?: string; // Animation effect type
  animation_delay?: number; // Animation delay in milliseconds
  order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomePage {
  id: number;
  // Organization info
  organization_name: string;
  tagline: string;

  // Hero section
  hero_title: string;
  hero_subtitle?: string;
  hero_background_image_url?: string; // Changed to match backend property
  hero_background_video_url?: string;
  hero_background_video_data?: Video;

  // Hero overlay configuration
  hero_overlay_enabled: boolean;
  hero_overlay_color: string;
  hero_overlay_opacity: number;

  // Call to action
  cta_title: string;
  cta_content?: string;
  cta_button_text: string;
  cta_button_url?: string;

  // Social media
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;

  // Campaign section customization
  campaigns_section_title: string;
  campaigns_section_subtitle?: string;
  show_campaigns_section: boolean;

  // Theme information
  theme?: Theme;

  // Meta information
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legal document types
export interface LegalDocumentResponse {
  id: number;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  document_type: string;
}
