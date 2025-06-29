import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';

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

  const fetchActiveTheme = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/themes/active/');

      if (response.ok) {
        const themeData = await response.json();
        setThemeState(themeData);
      } else if (response.status === 404) {
        // No active theme found
        setThemeState(null);
      } else {
        throw new Error('Failed to fetch theme');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
      setThemeState(null);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = (newTheme: Theme | null): void => {
    setThemeState(newTheme);

    // Apply CSS variables to the document root
    if (newTheme) {
      applyThemeToDocument(newTheme);
    } else {
      removeThemeFromDocument();
    }
  };

  const refreshTheme = async (): Promise<void> => {
    await fetchActiveTheme();
  };

  // Apply theme CSS variables to the document
  const applyThemeToDocument = (themeData: Theme): void => {
    const root = document.documentElement;

    // Set CSS custom properties
    root.style.setProperty('--theme-primary', themeData.primary_color);
    root.style.setProperty('--theme-secondary', themeData.secondary_color);
    root.style.setProperty('--theme-accent', themeData.accent_color);

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
  };

  // Remove theme CSS variables from the document
  const removeThemeFromDocument = (): void => {
    const root = document.documentElement;

    // Remove theme CSS variables
    const themeVars = [
      '--theme-primary',
      '--theme-secondary',
      '--theme-accent',
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
      fetchActiveTheme();
    } else {
      // Apply the initial theme to the document
      applyThemeToDocument(initialTheme);
    }
  }, [initialTheme]);

  // Apply theme whenever it changes
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
