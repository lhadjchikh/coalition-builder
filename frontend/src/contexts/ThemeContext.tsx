import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, hexToRgb, lightenColor, darkenColor, rgbToHex } from '@shared/utils/theme';
import { loadGoogleFonts } from '@shared/utils/googleFonts';

interface ThemeContextType {
  theme: Theme | null;
  loading: boolean;
  error: string | null;
  setTheme: (theme: Theme | null) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme = null }) => {
  const [theme, setThemeState] = useState<Theme | null>(initialTheme);
  const [loading, setLoading] = useState(!initialTheme);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveTheme = async (signal?: AbortSignal): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/themes/active/', {
        signal,
      });

      if (signal?.aborted) return;

      if (response.ok) {
        const themeData = await response.json();
        if (!signal?.aborted) {
          setThemeState(themeData);
        }
      } else if (response.status === 404) {
        // No active theme found
        if (!signal?.aborted) {
          setThemeState(null);
        }
      } else {
        throw new Error('Failed to fetch theme');
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load theme');
        setThemeState(null);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const setTheme = (newTheme: Theme | null): void => {
    setThemeState(newTheme);
    // Theme application is handled by useEffect hook to avoid duplication
  };

  const refreshTheme = async (): Promise<void> => {
    await fetchActiveTheme();
  };

  // Apply theme CSS variables to the document
  const applyThemeToDocument = (themeData: Theme): void => {
    const root = document.documentElement;

    // Set CSS custom properties
    // Set primary color and variants
    root.style.setProperty('--theme-primary', themeData.primary_color);
    root.style.setProperty('--theme-primary-light', lightenColor(themeData.primary_color, 0.1));
    root.style.setProperty('--theme-primary-dark', darkenColor(themeData.primary_color, 0.1));
    const primaryRgb = hexToRgb(themeData.primary_color);
    if (primaryRgb) {
      root.style.setProperty(
        '--theme-primary-rgb',
        `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
      );
    }

    // Set secondary color and variants
    root.style.setProperty('--theme-secondary', themeData.secondary_color);
    root.style.setProperty('--theme-secondary-light', lightenColor(themeData.secondary_color, 0.1));
    root.style.setProperty('--theme-secondary-dark', darkenColor(themeData.secondary_color, 0.1));
    const secondaryRgb = hexToRgb(themeData.secondary_color);
    if (secondaryRgb) {
      root.style.setProperty(
        '--theme-secondary-rgb',
        `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`
      );
    }

    // Set accent color
    root.style.setProperty('--theme-accent', themeData.accent_color);

    // Set derived accent colors
    root.style.setProperty('--theme-accent-dark', darkenColor(themeData.accent_color, 0.1));
    root.style.setProperty('--theme-accent-darker', darkenColor(themeData.accent_color, 0.2));

    // Set RGB values for accent color
    const accentRgb = hexToRgb(themeData.accent_color);
    if (accentRgb) {
      root.style.setProperty(
        '--theme-accent-rgb',
        `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`
      );
    }

    root.style.setProperty('--theme-bg', themeData.background_color);
    root.style.setProperty('--theme-bg-section', themeData.section_background_color);
    root.style.setProperty('--theme-bg-card', themeData.card_background_color);

    root.style.setProperty('--theme-text-heading', themeData.heading_color);
    root.style.setProperty('--theme-text-body', themeData.body_text_color);
    root.style.setProperty('--theme-text-muted', themeData.muted_text_color);
    root.style.setProperty('--theme-text-link', themeData.link_color);
    root.style.setProperty('--theme-text-link-hover', themeData.link_hover_color);

    root.style.setProperty('--theme-font-heading', themeData.heading_font_family);
    root.style.setProperty('--theme-font-body', themeData.body_font_family);
    root.style.setProperty('--theme-font-size-base', `${themeData.font_size_base}rem`);
    root.style.setProperty('--theme-font-size-small', `${themeData.font_size_small}rem`);
    root.style.setProperty('--theme-font-size-large', `${themeData.font_size_large}rem`);

    // Update favicon if provided
    if (themeData.favicon_url) {
      updateFavicon(themeData.favicon_url);
    }

    // Load Google Fonts if specified
    if (themeData.google_fonts && themeData.google_fonts.length > 0) {
      loadGoogleFonts(themeData.google_fonts);
    }
  };

  // Remove theme CSS variables from the document
  const removeThemeFromDocument = (): void => {
    const root = document.documentElement;

    // Remove theme CSS variables
    const themeVars = [
      '--theme-primary',
      '--theme-primary-light',
      '--theme-primary-dark',
      '--theme-primary-rgb',
      '--theme-secondary',
      '--theme-secondary-light',
      '--theme-secondary-dark',
      '--theme-secondary-rgb',
      '--theme-accent',
      '--theme-accent-dark',
      '--theme-accent-darker',
      '--theme-accent-rgb',
      '--theme-bg',
      '--theme-bg-section',
      '--theme-bg-card',
      '--theme-text-heading',
      '--theme-text-body',
      '--theme-text-muted',
      '--theme-text-link',
      '--theme-text-link-hover',
      '--theme-font-heading',
      '--theme-font-body',
      '--theme-font-size-base',
      '--theme-font-size-small',
      '--theme-font-size-large',
    ];

    themeVars.forEach(varName => {
      root.style.removeProperty(varName);
    });
  };

  // Update the favicon
  const updateFavicon = (faviconUrl: string): void => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    link.href = faviconUrl;
  };

  // Load theme on mount if not provided initially
  useEffect(() => {
    if (!initialTheme) {
      const controller = new AbortController();
      fetchActiveTheme(controller.signal);

      return () => {
        controller.abort();
      };
    }
  }, [initialTheme]);

  // Apply theme whenever it changes (including initial theme)
  useEffect(() => {
    if (theme) {
      applyThemeToDocument(theme);
    } else {
      removeThemeFromDocument();
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    loading,
    error,
    setTheme,
    refreshTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for accessing theme colors in components
export const useThemeColors = () => {
  const { theme } = useTheme();

  if (!theme) {
    // Return default colors if no theme is active
    return {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#059669',
      background: '#ffffff',
      sectionBackground: '#f9fafb',
      cardBackground: '#ffffff',
      heading: '#111827',
      bodyText: '#374151',
      mutedText: '#6b7280',
      link: '#2563eb',
      linkHover: '#1d4ed8',
    };
  }

  return {
    primary: theme.primary_color,
    secondary: theme.secondary_color,
    accent: theme.accent_color,
    background: theme.background_color,
    sectionBackground: theme.section_background_color,
    cardBackground: theme.card_background_color,
    heading: theme.heading_color,
    bodyText: theme.body_text_color,
    mutedText: theme.muted_text_color,
    link: theme.link_color,
    linkHover: theme.link_hover_color,
  };
};

// Helper hook for accessing theme typography
export const useThemeTypography = () => {
  const { theme } = useTheme();

  if (!theme) {
    // Return default typography if no theme is active
    return {
      headingFont:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      bodyFont:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      sizeBase: '1rem',
      sizeSmall: '0.875rem',
      sizeLarge: '1.125rem',
    };
  }

  return {
    headingFont: theme.heading_font_family,
    bodyFont: theme.body_font_family,
    sizeBase: `${theme.font_size_base}rem`,
    sizeSmall: `${theme.font_size_small}rem`,
    sizeLarge: `${theme.font_size_large}rem`,
  };
};
