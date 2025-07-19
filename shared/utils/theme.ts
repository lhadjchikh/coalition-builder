// Shared theme utilities that work in both frontend and SSR environments

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

export const DEFAULT_THEME: Omit<Theme, "id" | "created_at" | "updated_at"> = {
  name: "Default Theme",
  description: "Default theme configuration",
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  accent_color: "#f59e0b",
  background_color: "#ffffff",
  section_background_color: "#f8fafc",
  card_background_color: "#ffffff",
  heading_color: "#1f2937",
  body_text_color: "#374151",
  muted_text_color: "#6b7280",
  link_color: "#2563eb",
  link_hover_color: "#1d4ed8",
  heading_font_family:
    'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  body_font_family:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  google_fonts: [],
  font_size_base: 1.0,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: "",
  logo_alt_text: "",
  favicon_url: "",
  custom_css: "",
  is_active: true,
};

/**
 * Generate CSS custom properties from a theme object
 */
export function generateCSSVariables(theme: Theme | null): string {
  const currentTheme = theme || {
    ...DEFAULT_THEME,
    id: 0,
    created_at: "",
    updated_at: "",
  };

  // Extract RGB values for better readability
  const primaryRgb = hexToRgb(currentTheme.primary_color);
  const primaryRgbValue = primaryRgb
    ? `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
    : "37, 99, 235";

  const secondaryRgb = hexToRgb(currentTheme.secondary_color);
  const secondaryRgbValue = secondaryRgb
    ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`
    : "100, 116, 139";

  const accentRgb = hexToRgb(currentTheme.accent_color);
  const accentRgbValue = accentRgb
    ? `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`
    : "245, 158, 11";

  return `
    :root {
      --theme-primary: ${currentTheme.primary_color};
      --theme-primary-light: ${lightenColor(currentTheme.primary_color, 0.1)};
      --theme-primary-dark: ${darkenColor(currentTheme.primary_color, 0.1)};
      --theme-primary-rgb: ${primaryRgbValue};
      
      --theme-secondary: ${currentTheme.secondary_color};
      --theme-secondary-light: ${lightenColor(currentTheme.secondary_color, 0.1)};
      --theme-secondary-dark: ${darkenColor(currentTheme.secondary_color, 0.1)};
      --theme-secondary-rgb: ${secondaryRgbValue};
      
      --theme-accent: ${currentTheme.accent_color};
      --theme-accent-light: ${lightenColor(currentTheme.accent_color, 0.1)};
      --theme-accent-dark: ${darkenColor(currentTheme.accent_color, 0.1)};
      --theme-accent-rgb: ${accentRgbValue};
      
      --theme-bg: ${currentTheme.background_color};
      --theme-bg-section: ${currentTheme.section_background_color};
      --theme-bg-card: ${currentTheme.card_background_color};
      
      --theme-text-heading: ${currentTheme.heading_color};
      --theme-text-body: ${currentTheme.body_text_color};
      --theme-text-muted: ${currentTheme.muted_text_color};
      --theme-text-link: ${currentTheme.link_color};
      --theme-text-link-hover: ${currentTheme.link_hover_color};
      
      --theme-font-heading: ${currentTheme.heading_font_family};
      --theme-font-body: ${currentTheme.body_font_family};
      --theme-font-size-base: ${currentTheme.font_size_base}rem;
      --theme-font-size-small: ${currentTheme.font_size_small}rem;
      --theme-font-size-large: ${currentTheme.font_size_large}rem;
    }
    
    /* Apply theme fonts to headings */
    h1, h2, h3 {
      font-family: var(--theme-font-heading), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  `.trim();
}

/**
 * Simple color manipulation functions (fallback if polished is not available)
 */
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return rgbToHex(newR, newG, newB);
}

export function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const newR = Math.max(0, Math.round(r * (1 - amount)));
  const newG = Math.max(0, Math.round(g * (1 - amount)));
  const newB = Math.max(0, Math.round(b * (1 - amount)));

  return rgbToHex(newR, newG, newB);
}

/**
 * Apply theme CSS variables to the document head (client-side only)
 */
export function applyThemeToDocument(theme: Theme | null): void {
  if (typeof document === "undefined") return;

  let styleElement = document.getElementById(
    "theme-variables",
  ) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "theme-variables";
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = generateCSSVariables(theme);
}

/**
 * Get theme CSS variables for SSR injection
 */
export function getThemeCSS(theme: Theme | null): string {
  return `<style id="theme-variables">${generateCSSVariables(theme)}</style>`;
}
