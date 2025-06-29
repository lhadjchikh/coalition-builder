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

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: themeCSS,
      }}
    />
  );
};
