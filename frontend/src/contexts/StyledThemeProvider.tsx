import React, { useEffect, useMemo } from 'react';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { lighten, darken } from 'polished';
import { useTheme } from './ThemeContext';
import { createStyledTheme } from '@styles/theme';

interface EnhancedThemeProviderProps {
  children: React.ReactNode;
}

// Global styles that use theme variables
const GlobalStyle = createGlobalStyle`
  /* CSS Variables for compatibility with existing components */
  :root {
    /* Brand Colors with automatic variations */
    --theme-primary: ${props => props.theme.colors.primary};
    --theme-primary-light: ${props => lighten(0.1, props.theme.colors.primary)};
    --theme-primary-dark: ${props => darken(0.1, props.theme.colors.primary)};
    
    --theme-secondary: ${props => props.theme.colors.secondary};
    --theme-secondary-light: ${props => lighten(0.1, props.theme.colors.secondary)};
    --theme-secondary-dark: ${props => darken(0.1, props.theme.colors.secondary)};
    
    --theme-accent: ${props => props.theme.colors.accent};
    --theme-accent-light: ${props => lighten(0.1, props.theme.colors.accent)};
    --theme-accent-dark: ${props => darken(0.1, props.theme.colors.accent)};
    
    /* Background Colors */
    --theme-bg: ${props => props.theme.colors.background};
    --theme-bg-section: ${props => props.theme.colors.backgroundSection};
    --theme-bg-card: ${props => props.theme.colors.backgroundCard};
    
    /* Text Colors */
    --theme-text-heading: ${props => props.theme.colors.textHeading};
    --theme-text-body: ${props => props.theme.colors.textBody};
    --theme-text-muted: ${props => props.theme.colors.textMuted};
    --theme-text-link: ${props => props.theme.colors.textLink};
    --theme-text-link-hover: ${props => props.theme.colors.textLinkHover};
    
    /* Typography */
    --theme-font-heading: ${props => props.theme.typography.fonts.heading};
    --theme-font-body: ${props => props.theme.typography.fonts.body};
    --theme-font-size-base: ${props => props.theme.typography.sizes.base};
    --theme-font-size-small: ${props => props.theme.typography.sizes.sm};
    --theme-font-size-large: ${props => props.theme.typography.sizes.lg};
    
    /* Semantic Colors */
    --theme-success: ${props => props.theme.colors.success};
    --theme-warning: ${props => props.theme.colors.warning};
    --theme-error: ${props => props.theme.colors.error};
    --theme-info: ${props => props.theme.colors.info};
  }
  
  /* Enhanced Tailwind-compatible classes */
  .bg-theme-primary { background-color: var(--theme-primary) !important; }
  .bg-theme-primary-light { background-color: var(--theme-primary-light) !important; }
  .bg-theme-primary-dark { background-color: var(--theme-primary-dark) !important; }
  
  .text-theme-primary { color: var(--theme-primary) !important; }
  .text-theme-primary-light { color: var(--theme-primary-light) !important; }
  .text-theme-primary-dark { color: var(--theme-primary-dark) !important; }
  
  .border-theme-primary { border-color: var(--theme-primary) !important; }
  .border-theme-primary-light { border-color: var(--theme-primary-light) !important; }
  .border-theme-primary-dark { border-color: var(--theme-primary-dark) !important; }
  
  /* Hover utilities */
  .hover\\:bg-theme-primary-light:hover { background-color: var(--theme-primary-light) !important; }
  .hover\\:bg-theme-primary-dark:hover { background-color: var(--theme-primary-dark) !important; }
  .hover\\:text-theme-primary-light:hover { color: var(--theme-primary-light) !important; }
  .hover\\:text-theme-primary-dark:hover { color: var(--theme-primary-dark) !important; }
  
  /* Focus utilities */
  .focus\\:ring-theme-primary:focus {
    --tw-ring-color: var(--theme-primary) !important;
    box-shadow: 0 0 0 3px rgba(${props => {
      const color = props.theme.colors.primary;
      // Extract RGB values from hex
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '37, 99, 235';
    }}, 0.2) !important;
  }
  
  /* Enhanced button classes */
  .btn-theme-primary {
    background-color: var(--theme-primary);
    color: white;
    border: 2px solid var(--theme-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
  }
  
  .btn-theme-primary:hover {
    background-color: var(--theme-primary-light);
    border-color: var(--theme-primary-light);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(${props => {
      const color = props.theme.colors.primary;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '37, 99, 235';
    }}, 0.3);
  }
  
  .btn-theme-primary:active {
    background-color: var(--theme-primary-dark);
    border-color: var(--theme-primary-dark);
    transform: translateY(0);
  }
  
  .btn-theme-outline {
    background-color: transparent;
    color: var(--theme-primary);
    border: 2px solid var(--theme-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
  }
  
  .btn-theme-outline:hover {
    background-color: var(--theme-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(${props => {
      const color = props.theme.colors.primary;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '37, 99, 235';
    }}, 0.3);
  }
  
  /* Enhanced card styles */
  .card-theme-enhanced {
    background-color: var(--theme-bg-card);
    border: 1px solid rgba(${props => {
      const color = props.theme.colors.secondary;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '100, 116, 139';
    }}, 0.2);
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .card-theme-enhanced:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  /* Reset and base styles */
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: ${props => props.theme.typography.fonts.body};
    color: ${props => props.theme.colors.textBody};
    background-color: ${props => props.theme.colors.background};
    line-height: ${props => props.theme.typography.lineHeights.normal};
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.typography.fonts.heading};
    color: ${props => props.theme.colors.textHeading};
    font-weight: ${props => props.theme.typography.weights.bold};
    line-height: ${props => props.theme.typography.lineHeights.tight};
  }
`;

export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({ children }) => {
  const { theme: dbTheme, loading } = useTheme();

  // Create styled-components theme with enhanced colors using polished
  const styledTheme = useMemo(() => {
    try {
      const baseTheme = createStyledTheme(dbTheme);

      // Enhance theme with polished color variations
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          // Auto-generate color variations
          primaryLight: lighten(0.1, baseTheme.colors.primary),
          primaryDark: darken(0.1, baseTheme.colors.primary),
          secondaryLight: lighten(0.1, baseTheme.colors.secondary),
          secondaryDark: darken(0.1, baseTheme.colors.secondary),
          accentLight: lighten(0.1, baseTheme.colors.accent),
          accentDark: darken(0.1, baseTheme.colors.accent),
        },
      };
    } catch (error) {
      console.warn('Error creating styled theme, falling back to default:', error);
      // Fallback to default theme
      return createStyledTheme(null);
    }
  }, [dbTheme]);

  // Update favicon when theme changes
  useEffect(() => {
    if (dbTheme?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      link.href = dbTheme.favicon_url;
    }
  }, [dbTheme?.favicon_url]);

  return (
    <StyledThemeProvider theme={styledTheme}>
      <GlobalStyle />
      {loading ? <div>Loading theme...</div> : children}
    </StyledThemeProvider>
  );
};
