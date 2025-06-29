import { Theme as DatabaseTheme } from '../types';

// Styled-components theme interface
export interface StyledTheme {
  colors: {
    // Brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;

    // Background colors
    background: string;
    backgroundSection: string;
    backgroundCard: string;

    // Text colors
    textHeading: string;
    textBody: string;
    textMuted: string;
    textLink: string;
    textLinkHover: string;

    // Semantic colors (auto-generated from brand colors)
    success: string;
    warning: string;
    error: string;
    info: string;

    // Utility colors
    white: string;
    black: string;
    gray: string[];
  };

  typography: {
    fonts: {
      heading: string;
      body: string;
    };
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    weights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };

  spacing: {
    px: string;
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
  };

  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
  };

  radii: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };

  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Default theme values (fallback when no database theme is active)
export const defaultTheme: StyledTheme = {
  colors: {
    // Brand colors
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    secondaryLight: '#94a3b8',
    secondaryDark: '#475569',
    accent: '#059669',
    accentLight: '#10b981',
    accentDark: '#047857',

    // Background colors
    background: '#ffffff',
    backgroundSection: '#f9fafb',
    backgroundCard: '#ffffff',

    // Text colors
    textHeading: '#111827',
    textBody: '#374151',
    textMuted: '#6b7280',
    textLink: '#2563eb',
    textLinkHover: '#1d4ed8',

    // Semantic colors
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',

    // Utility colors
    white: '#ffffff',
    black: '#000000',
    gray: [
      '#f9fafb',
      '#f3f4f6',
      '#e5e7eb',
      '#d1d5db',
      '#9ca3af',
      '#6b7280',
      '#374151',
      '#1f2937',
      '#111827',
    ],
  },

  typography: {
    fonts: {
      heading:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    },
    sizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
    40: '10rem', // 160px
    48: '12rem', // 192px
    56: '14rem', // 224px
    64: '16rem', // 256px
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  radii: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    full: '9999px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },
};

// Convert database theme to styled-components theme
export const createStyledTheme = (dbTheme: DatabaseTheme | null): StyledTheme => {
  if (!dbTheme) {
    return defaultTheme;
  }

  return {
    ...defaultTheme, // Use default spacing, shadows, etc.
    colors: {
      // Brand colors from database
      primary: dbTheme.primary_color,
      primaryLight: dbTheme.primary_color, // Will be enhanced with polished
      primaryDark: dbTheme.primary_color, // Will be enhanced with polished
      secondary: dbTheme.secondary_color,
      secondaryLight: dbTheme.secondary_color,
      secondaryDark: dbTheme.secondary_color,
      accent: dbTheme.accent_color,
      accentLight: dbTheme.accent_color,
      accentDark: dbTheme.accent_color,

      // Background colors from database
      background: dbTheme.background_color,
      backgroundSection: dbTheme.section_background_color,
      backgroundCard: dbTheme.card_background_color,

      // Text colors from database
      textHeading: dbTheme.heading_color,
      textBody: dbTheme.body_text_color,
      textMuted: dbTheme.muted_text_color,
      textLink: dbTheme.link_color,
      textLinkHover: dbTheme.link_hover_color,

      // Keep semantic and utility colors from default
      success: defaultTheme.colors.success,
      warning: defaultTheme.colors.warning,
      error: defaultTheme.colors.error,
      info: dbTheme.primary_color, // Use theme primary for info
      white: defaultTheme.colors.white,
      black: defaultTheme.colors.black,
      gray: defaultTheme.colors.gray,
    },
    typography: {
      fonts: {
        heading: dbTheme.heading_font_family,
        body: dbTheme.body_font_family,
      },
      sizes: {
        ...defaultTheme.typography.sizes,
        sm: `${dbTheme.font_size_small}rem`,
        base: `${dbTheme.font_size_base}rem`,
        lg: `${dbTheme.font_size_large}rem`,
      },
      weights: defaultTheme.typography.weights,
      lineHeights: defaultTheme.typography.lineHeights,
    },
  };
};
