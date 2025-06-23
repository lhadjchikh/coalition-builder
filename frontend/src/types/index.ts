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

// Endorser type definition
export interface Endorser {
  id: number;
  name: string;
  type: string;
  website?: string;
  description?: string;
}

// Legislator type definition
export interface Legislator {
  id: number;
  name: string;
  district: string;
  party?: string;
  contact_info?: string;
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
  user_agent?: string;
  referrer?: string;
  form_version?: string;
}

export interface EndorsementCreate {
  campaign_id: number;
  stakeholder: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>;
  statement?: string;
  public_display: boolean;
  form_metadata?: SpamPreventionMetadata; // For spam prevention
}
