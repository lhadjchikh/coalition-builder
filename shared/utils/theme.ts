// Shared theme utilities that work in both frontend and SSR environments

export interface Theme {
  id: number;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  background_section_color: string;
  background_card_color: string;
  text_heading_color: string;
  text_body_color: string;
  text_muted_color: string;
  text_link_color: string;
  text_link_hover_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  info_color: string;
  heading_font_family: string;
  body_font_family: string;
  base_font_size: number;
  logo_url?: string;
  favicon_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_THEME: Omit<Theme, "id" | "created_at" | "updated_at"> = {
  name: "Default Theme",
  primary_color: "#2563eb",
  secondary_color: "#64748b",
  accent_color: "#f59e0b",
  background_color: "#ffffff",
  background_section_color: "#f8fafc",
  background_card_color: "#ffffff",
  text_heading_color: "#1f2937",
  text_body_color: "#374151",
  text_muted_color: "#6b7280",
  text_link_color: "#2563eb",
  text_link_hover_color: "#1d4ed8",
  success_color: "#10b981",
  warning_color: "#f59e0b",
  error_color: "#ef4444",
  info_color: "#3b82f6",
  heading_font_family:
    'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  body_font_family:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  base_font_size: 16,
  logo_url: "",
  favicon_url: "",
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

  return `
    :root {
      --theme-primary: ${currentTheme.primary_color};
      --theme-primary-light: ${lightenColor(currentTheme.primary_color, 0.1)};
      --theme-primary-dark: ${darkenColor(currentTheme.primary_color, 0.1)};
      
      --theme-secondary: ${currentTheme.secondary_color};
      --theme-secondary-light: ${lightenColor(currentTheme.secondary_color, 0.1)};
      --theme-secondary-dark: ${darkenColor(currentTheme.secondary_color, 0.1)};
      
      --theme-accent: ${currentTheme.accent_color};
      --theme-accent-light: ${lightenColor(currentTheme.accent_color, 0.1)};
      --theme-accent-dark: ${darkenColor(currentTheme.accent_color, 0.1)};
      
      --theme-bg: ${currentTheme.background_color};
      --theme-bg-section: ${currentTheme.background_section_color};
      --theme-bg-card: ${currentTheme.background_card_color};
      
      --theme-text-heading: ${currentTheme.text_heading_color};
      --theme-text-body: ${currentTheme.text_body_color};
      --theme-text-muted: ${currentTheme.text_muted_color};
      --theme-text-link: ${currentTheme.text_link_color};
      --theme-text-link-hover: ${currentTheme.text_link_hover_color};
      
      --theme-success: ${currentTheme.success_color};
      --theme-warning: ${currentTheme.warning_color};
      --theme-error: ${currentTheme.error_color};
      --theme-info: ${currentTheme.info_color};
      
      --theme-font-heading: ${currentTheme.heading_font_family};
      --theme-font-body: ${currentTheme.body_font_family};
      --theme-font-size-base: ${currentTheme.base_font_size}px;
      --theme-font-size-small: ${currentTheme.base_font_size * 0.875}px;
      --theme-font-size-large: ${currentTheme.base_font_size * 1.125}px;
    }
  `.trim();
}

/**
 * Simple color manipulation functions (fallback if polished is not available)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return rgbToHex(newR, newG, newB);
}

function darkenColor(hex: string, amount: number): string {
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
