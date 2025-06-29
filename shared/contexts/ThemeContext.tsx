import * as React from "react";
const { createContext, useContext, useEffect, useState } = React;
import { Theme, DEFAULT_THEME, applyThemeToDocument } from "../utils/theme";

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
  isServer?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = null,
  isServer = typeof window === "undefined",
}) => {
  const [theme, setThemeState] = useState<Theme | null>(initialTheme);
  const [loading, setLoading] = useState(!initialTheme && !isServer);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveTheme = async (): Promise<void> => {
    // Only fetch on client side
    if (isServer) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/themes/active/");

      if (response.ok) {
        const themeData = await response.json();
        setThemeState(themeData);
      } else if (response.status === 404) {
        // No active theme found
        setThemeState(null);
      } else {
        throw new Error("Failed to fetch theme");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load theme");
      setThemeState(null);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = (newTheme: Theme | null): void => {
    setThemeState(newTheme);

    // Apply CSS variables to the document (client-side only)
    if (!isServer) {
      applyThemeToDocument(newTheme);
    }
  };

  const refreshTheme = async (): Promise<void> => {
    if (!isServer) {
      await fetchActiveTheme();
    }
  };

  // Load theme on mount if not provided initially (client-side only)
  useEffect(() => {
    if (!isServer && !initialTheme) {
      fetchActiveTheme();
    } else if (initialTheme) {
      // Apply the initial theme to the document (client-side only)
      if (!isServer) {
        applyThemeToDocument(initialTheme);
      }
    }
  }, [initialTheme, isServer]);

  // Apply theme whenever it changes (client-side only)
  useEffect(() => {
    if (!isServer) {
      applyThemeToDocument(theme);
    }
  }, [theme, isServer]);

  const value: ThemeContextType = {
    theme,
    loading,
    error,
    setTheme,
    refreshTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Helper hook for accessing theme colors in components
export const useThemeColors = () => {
  const { theme } = useTheme();

  const currentTheme = theme || {
    ...DEFAULT_THEME,
    id: 0,
    created_at: "",
    updated_at: "",
  };

  return {
    primary: currentTheme.primary_color,
    secondary: currentTheme.secondary_color,
    accent: currentTheme.accent_color,
    background: currentTheme.background_color,
    sectionBackground: currentTheme.background_section_color,
    cardBackground: currentTheme.background_card_color,
    heading: currentTheme.text_heading_color,
    bodyText: currentTheme.text_body_color,
    mutedText: currentTheme.text_muted_color,
    link: currentTheme.text_link_color,
    linkHover: currentTheme.text_link_hover_color,
    success: currentTheme.success_color,
    warning: currentTheme.warning_color,
    error: currentTheme.error_color,
    info: currentTheme.info_color,
  };
};

// Helper hook for accessing theme typography
export const useThemeTypography = () => {
  const { theme } = useTheme();

  const currentTheme = theme || {
    ...DEFAULT_THEME,
    id: 0,
    created_at: "",
    updated_at: "",
  };

  return {
    headingFont: currentTheme.heading_font_family,
    bodyFont: currentTheme.body_font_family,
    sizeBase: `${currentTheme.base_font_size}px`,
    sizeSmall: `${currentTheme.base_font_size * 0.875}px`,
    sizeLarge: `${currentTheme.base_font_size * 1.125}px`,
  };
};
