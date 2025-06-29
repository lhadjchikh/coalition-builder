import React from 'react';
import { Theme } from '../types';

interface ThemeStylesProps {
  theme?: Theme | null;
}

/**
 * Component that injects theme-based CSS into the document head.
 * This provides a fallback for when CSS variables are not supported
 * and ensures theme styles are available immediately on page load.
 */
export const ThemeStyles: React.FC<ThemeStylesProps> = ({ theme }) => {
  if (!theme) {
    return null;
  }

  const generateThemeCSS = (themeData: Theme): string => {
    return `
      :root {
        /* Brand Colors */
        --theme-primary: ${themeData.primary_color};
        --theme-secondary: ${themeData.secondary_color};
        --theme-accent: ${themeData.accent_color};
        
        /* Background Colors */
        --theme-bg: ${themeData.background_color};
        --theme-bg-section: ${themeData.section_background_color};
        --theme-bg-card: ${themeData.card_background_color};
        
        /* Text Colors */
        --theme-text-heading: ${themeData.heading_color};
        --theme-text-body: ${themeData.body_text_color};
        --theme-text-muted: ${themeData.muted_text_color};
        --theme-text-link: ${themeData.link_color};
        --theme-text-link-hover: ${themeData.link_hover_color};
        
        /* Typography */
        --theme-font-heading: ${themeData.heading_font_family};
        --theme-font-body: ${themeData.body_font_family};
        --theme-font-size-base: ${themeData.font_size_base}rem;
        --theme-font-size-small: ${themeData.font_size_small}rem;
        --theme-font-size-large: ${themeData.font_size_large}rem;
      }

      /* Theme Utility Classes */
      
      /* Background utilities */
      .bg-theme-primary { background-color: var(--theme-primary); }
      .bg-theme-secondary { background-color: var(--theme-secondary); }
      .bg-theme-accent { background-color: var(--theme-accent); }
      .bg-theme-bg { background-color: var(--theme-bg); }
      .bg-theme-section { background-color: var(--theme-bg-section); }
      .bg-theme-card { background-color: var(--theme-bg-card); }

      /* Text color utilities */
      .text-theme-primary { color: var(--theme-primary); }
      .text-theme-secondary { color: var(--theme-secondary); }
      .text-theme-accent { color: var(--theme-accent); }
      .text-theme-heading { color: var(--theme-text-heading); }
      .text-theme-body { color: var(--theme-text-body); }
      .text-theme-muted { color: var(--theme-text-muted); }
      .text-theme-link { color: var(--theme-text-link); }

      /* Border utilities */
      .border-theme-primary { border-color: var(--theme-primary); }
      .border-theme-secondary { border-color: var(--theme-secondary); }
      .border-theme-accent { border-color: var(--theme-accent); }

      /* Font family utilities */
      .font-theme-heading { font-family: var(--theme-font-heading); }
      .font-theme-body { font-family: var(--theme-font-body); }

      /* Font size utilities */
      .text-theme-base { font-size: var(--theme-font-size-base); }
      .text-theme-small { font-size: var(--theme-font-size-small); }
      .text-theme-large { font-size: var(--theme-font-size-large); }

      /* Link styles with hover effects */
      .link-theme {
        color: var(--theme-text-link);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .link-theme:hover {
        color: var(--theme-text-link-hover);
      }

      /* Button variants using theme colors */
      .btn-theme-primary {
        background-color: var(--theme-primary);
        color: white;
        border: 2px solid var(--theme-primary);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
      }

      .btn-theme-primary:hover {
        background-color: transparent;
        color: var(--theme-primary);
      }

      .btn-theme-secondary {
        background-color: var(--theme-secondary);
        color: white;
        border: 2px solid var(--theme-secondary);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
      }

      .btn-theme-secondary:hover {
        background-color: transparent;
        color: var(--theme-secondary);
      }

      .btn-theme-accent {
        background-color: var(--theme-accent);
        color: white;
        border: 2px solid var(--theme-accent);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        cursor: pointer;
      }

      .btn-theme-accent:hover {
        background-color: transparent;
        color: var(--theme-accent);
      }

      /* Card styling with theme colors */
      .card-theme {
        background-color: var(--theme-bg-card);
        border: 1px solid var(--theme-secondary);
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      /* Section styling */
      .section-theme {
        background-color: var(--theme-bg-section);
        padding: 3rem 0;
      }

      .section-theme-alt {
        background-color: var(--theme-bg);
        padding: 3rem 0;
      }

      ${themeData.custom_css || ''}
    `;
  };

  const themeCSS = generateThemeCSS(theme);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: themeCSS,
      }}
    />
  );
};
