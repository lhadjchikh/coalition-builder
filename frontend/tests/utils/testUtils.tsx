import React from "react";
import { render, act, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { DEFAULT_THEME } from "../../utils/theme";
import {
  Campaign,
  Endorser,
  Legislator,
  Endorsement,
  HomePage,
  ContentBlock,
  Theme,
  Stakeholder,
} from "../../types/index";

// Utility function to wait for all async operations to complete
export const waitForAsyncUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

// Utility to properly mock API calls with act() wrapper
export const mockAPICall = async <T,>(
  mockFn: jest.MockedFunction<any>,
  returnValue: T,
  shouldReject = false,
) => {
  if (shouldReject) {
    mockFn.mockRejectedValueOnce(returnValue);
  } else {
    mockFn.mockResolvedValueOnce(returnValue);
  }
  await waitForAsyncUpdates();
};

// Enhanced render function that waits for initial async operations
export const renderWithAsyncUpdates = async (ui: React.ReactElement) => {
  const result = render(ui);
  await waitForAsyncUpdates();
  return result;
};

// Utility to resolve promises in tests with proper act() wrapping
export const resolvePromiseInTest = async <T,>(
  resolveFunction: (value: T) => void,
  value: T,
) => {
  await act(async () => {
    resolveFunction(value);
  });
};

// Utility to reject promises in tests with proper act() wrapping
export const rejectPromiseInTest = async (
  rejectFunction: (reason: any) => void,
  reason: any,
) => {
  await act(async () => {
    // Call the reject function within act() wrapper
    rejectFunction(reason);
  });
};

// Theme-aware wrapper for tests
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <ThemeProvider theme={DEFAULT_THEME}>{children}</ThemeProvider>;

// Custom render function with theme provider
export const renderWithTheme = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => {
  return render(ui, { wrapper: ThemeWrapper, ...options });
};

// Mock data factories
export const createMockCampaign = (
  overrides: Partial<Campaign> = {},
): Campaign => ({
  id: 1,
  name: "test-campaign",
  title: "Test Campaign",
  summary: "Test campaign summary",
  description: "Test campaign description",
  active: true,
  created_at: "2023-01-01T00:00:00Z",
  allow_endorsements: true,
  endorsement_statement: "I support this campaign",
  endorsement_form_instructions: "Please fill out the form",
  ...overrides,
});

export const createMockEndorser = (
  overrides: Partial<Endorser> = {},
): Endorser => ({
  id: 1,
  first_name: "John",
  last_name: "Doe",
  organization: "Test Organization",
  email: "john@example.com",
  street_address: "123 Main St",
  city: "Los Angeles",
  state: "CA",
  zip_code: "90001",
  type: "individual",
  role: "Citizen",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

export const createMockLegislator = (
  overrides: Partial<Legislator> = {},
): Legislator => ({
  id: 1,
  first_name: "Jane",
  last_name: "Smith",
  chamber: "Senate",
  state: "CA",
  district: "1st",
  is_senior: false,
  ...overrides,
});

export const createMockEndorsement = (
  overrides: Partial<Endorsement> = {},
): Endorsement => ({
  id: 1,
  stakeholder: createMockEndorser() as Stakeholder,
  campaign: createMockCampaign(),
  statement: "I support this campaign",
  public_display: true,
  created_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

export const createMockHomePage = (
  overrides: Partial<HomePage> = {},
): HomePage => ({
  id: 1,
  organization_name: "Test Organization",
  tagline: "Test Tagline",
  hero_title: "Test Hero Title",
  hero_subtitle: "Test Hero Subtitle",
  hero_background_image_url: "hero.jpg",
  hero_overlay_enabled: true,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 0.4,
  cta_title: "Get Involved",
  cta_content: "Join our mission",
  cta_button_text: "Learn More",
  cta_button_url: "https://example.com",
  campaigns_section_title: "Our Campaigns",
  show_campaigns_section: true,
  facebook_url: "https://facebook.com/test",
  twitter_url: "https://twitter.com/test",
  instagram_url: "https://instagram.com/test",
  linkedin_url: "https://linkedin.com/test",
  campaigns_section_subtitle: "Current initiatives",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

export const createMockContentBlock = (
  overrides: Partial<ContentBlock> = {},
): ContentBlock => ({
  id: 1,
  title: "Test Block",
  block_type: "text",
  page_type: "homepage",
  content: "<p>Test content</p>",
  image_url: "",
  image_alt_text: "",
  image_title: "",
  image_author: "",
  image_license: "",
  image_source_url: "",
  css_classes: "",
  background_color: "",
  order: 1,
  is_visible: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

export const createMockTheme = (overrides: Partial<Theme> = {}): Theme => ({
  id: 1,
  name: "Test Theme",
  description: "Test theme description",
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  accent_color: "#059669",
  background_color: "#ffffff",
  section_background_color: "#f9fafb",
  card_background_color: "#ffffff",
  heading_color: "#111827",
  body_text_color: "#374151",
  muted_text_color: "#6b7280",
  link_color: "#2563eb",
  link_hover_color: "#1d4ed8",
  heading_font_family: "Inter, sans-serif",
  body_font_family: "Inter, sans-serif",
  google_fonts: ["Inter"],
  font_size_base: 1,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: "https://example.com/logo.png",
  logo_alt_text: "Test Logo",
  favicon_url: "https://example.com/favicon.ico",
  custom_css: ".custom { color: red; }",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

// Accessibility testing utilities
export const getByAriaLabel = (container: HTMLElement, label: string) => {
  return container.querySelector(`[aria-label="${label}"]`);
};

export const getByRole = (container: HTMLElement, role: string) => {
  return container.querySelector(`[role="${role}"]`);
};

export const hasValidAltText = (img: HTMLImageElement) => {
  return img.alt && img.alt.trim().length > 0;
};

export const hasValidHeadingHierarchy = (container: HTMLElement) => {
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  if (headings.length === 0) return true;

  let lastLevel = 0;
  for (const heading of Array.from(headings)) {
    const level = parseInt(heading.tagName.charAt(1));
    if (lastLevel > 0 && level > lastLevel + 1) {
      return false; // Skipped a level
    }
    lastLevel = level;
  }
  return true;
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  await act(async () => {
    renderFn();
  });
  const end = performance.now();
  return end - start;
};

// Network mocking utilities
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  ) as jest.Mock;
};

export const mockFetchError = (status: number, message?: string) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ detail: message || "Error occurred" }),
    }),
  ) as jest.Mock;
};

export const mockFetchNetworkError = () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error("Network error")),
  ) as jest.Mock;
};

// Error suppression utilities for cleaner test output
export const withSuppressedErrors = async (
  expectedPatterns: (string | RegExp)[],
  testFn: () => Promise<void>,
) => {
  const originalConsoleError = console.error;

  console.error = (...args: any[]) => {
    const message = args.join(" ");
    const isExpectedError = expectedPatterns.some((pattern) => {
      if (typeof pattern === "string") {
        return message.includes(pattern);
      }
      return pattern.test(message);
    });

    // Only log if it's not an expected error
    if (!isExpectedError) {
      originalConsoleError(...args);
    }
  };

  try {
    await testFn();
  } finally {
    console.error = originalConsoleError;
  }
};
