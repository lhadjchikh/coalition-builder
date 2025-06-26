// Campaign type definition
export interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  endorsement_statement?: string;
  allow_endorsements?: boolean;
  endorsement_form_instructions?: string;
  created_at?: string;
  updated_at?: string;
}

// Endorser type definition (matches StakeholderOut schema)
export interface Endorser {
  id: number;
  name: string;
  organization: string;
  role?: string;
  email: string;
  street_address?: string;
  city?: string;
  state: string;
  zip_code?: string;
  county?: string;
  type: 'farmer' | 'waterman' | 'business' | 'nonprofit' | 'individual' | 'government' | 'other';
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
  name: string;
  organization: string;
  role?: string;
  email: string;
  state: string;
  county?: string;
  type: 'farmer' | 'waterman' | 'business' | 'nonprofit' | 'individual' | 'government' | 'other';
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

// For creating new endorsements
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

export interface EndorsementCreate {
  campaign_id: number;
  stakeholder: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>;
  statement?: string;
  public_display: boolean;
  form_metadata?: SpamPreventionMetadata; // For spam prevention
}

// Homepage and content management types
export interface ContentBlock {
  id: number;
  title: string;
  block_type: string;
  content: string;
  image_url: string;
  image_alt_text: string;
  css_classes: string;
  background_color: string;
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
  hero_subtitle: string;
  hero_background_image: string;

  // Main content sections
  about_section_title: string;
  about_section_content: string;

  // Call to action
  cta_title: string;
  cta_content: string;
  cta_button_text: string;
  cta_button_url: string;

  // Contact information
  contact_email: string;
  contact_phone: string;

  // Social media
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;

  // Campaign section customization
  campaigns_section_title: string;
  campaigns_section_subtitle: string;
  show_campaigns_section: boolean;

  // Content blocks
  content_blocks: ContentBlock[];

  // Meta information
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
