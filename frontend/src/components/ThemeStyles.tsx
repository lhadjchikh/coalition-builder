import React from 'react';
import { Theme, generateCSSVariables } from '@shared/utils/theme';

interface ThemeStylesProps {
  theme?: Theme | null;
}

/**
 * Component that injects theme-based CSS into the document head.
 * This provides a fallback for when CSS variables are not supported
 * and ensures theme styles are available immediately on page load.
 */
export const ThemeStyles: React.FC<ThemeStylesProps> = ({ theme }) => {
  const themeCSS = generateCSSVariables(theme ?? null);

  // Global heading styles to use theme fonts
  const headingStyles = `
    h1, h2, h3 {
      font-family: var(--theme-font-heading), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  `;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: themeCSS,
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: headingStyles }} />
    </>
  );
};
