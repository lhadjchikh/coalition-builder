import { useTheme as useStyledComponentsTheme } from 'styled-components';
import { lighten, darken, transparentize, rgba } from 'polished';
import { StyledTheme } from '@styles/theme';

// Enhanced theme hook with polished utilities
export const useStyledTheme = () => {
  const theme = useStyledComponentsTheme() as StyledTheme;

  return {
    theme,

    // Color utilities
    colors: {
      ...theme.colors,
      // Generate variations on demand
      getPrimaryVariant: (variant: 'light' | 'dark' | 'transparent', amount = 0.1) => {
        switch (variant) {
          case 'light':
            return lighten(amount, theme.colors.primary);
          case 'dark':
            return darken(amount, theme.colors.primary);
          case 'transparent':
            return transparentize(amount, theme.colors.primary);
          default:
            return theme.colors.primary;
        }
      },

      getSecondaryVariant: (variant: 'light' | 'dark' | 'transparent', amount = 0.1) => {
        switch (variant) {
          case 'light':
            return lighten(amount, theme.colors.secondary);
          case 'dark':
            return darken(amount, theme.colors.secondary);
          case 'transparent':
            return transparentize(amount, theme.colors.secondary);
          default:
            return theme.colors.secondary;
        }
      },

      getAccentVariant: (variant: 'light' | 'dark' | 'transparent', amount = 0.1) => {
        switch (variant) {
          case 'light':
            return lighten(amount, theme.colors.accent);
          case 'dark':
            return darken(amount, theme.colors.accent);
          case 'transparent':
            return transparentize(amount, theme.colors.accent);
          default:
            return theme.colors.accent;
        }
      },

      // Create rgba colors for shadows and overlays
      createRgba: (color: string, alpha: number) => rgba(color, alpha),
    },

    // Responsive utilities
    breakpoints: {
      ...theme.breakpoints,
      up: (size: keyof StyledTheme['breakpoints']) =>
        `@media (min-width: ${theme.breakpoints[size]})`,
      down: (size: keyof StyledTheme['breakpoints']) => {
        const breakpointValues = {
          sm: '639px',
          md: '767px',
          lg: '1023px',
          xl: '1279px',
          '2xl': '1535px',
        };
        return `@media (max-width: ${breakpointValues[size]})`;
      },
    },

    // Typography utilities
    typography: {
      ...theme.typography,
      // Get responsive font sizes
      getResponsiveFontSize: (size: keyof StyledTheme['typography']['sizes']) => {
        const baseSize = theme.typography.sizes[size];
        return {
          fontSize: baseSize,
          [`@media (min-width: ${theme.breakpoints.md})`]: {
            fontSize: `calc(${baseSize} * 1.1)`,
          },
          [`@media (min-width: ${theme.breakpoints.lg})`]: {
            fontSize: `calc(${baseSize} * 1.2)`,
          },
        };
      },
    },

    // Spacing utilities
    spacing: {
      ...theme.spacing,
      // Create responsive spacing
      getResponsiveSpacing: (size: keyof StyledTheme['spacing']) => {
        const baseSpacing = theme.spacing[size];
        return {
          [`@media (max-width: ${theme.breakpoints.sm})`]: {
            padding: `calc(${baseSpacing} * 0.75)`,
          },
          [`@media (min-width: ${theme.breakpoints.lg})`]: {
            padding: `calc(${baseSpacing} * 1.25)`,
          },
        };
      },
    },

    // Animation utilities
    animations: {
      // Common hover effects
      hover: {
        lift: {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows.lg,
          transition: theme.transitions.normal,
        },
        glow: (color: string = theme.colors.primary) => ({
          boxShadow: `0 0 20px ${rgba(color, 0.4)}`,
          transition: theme.transitions.normal,
        }),
        scale: {
          transform: 'scale(1.05)',
          transition: theme.transitions.fast,
        },
      },

      // Loading animations
      loading: {
        pulse: {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
        },
        spin: {
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
          },
        },
      },
    },

    // Shadow utilities
    shadows: {
      ...theme.shadows,
      // Create colored shadows
      getColoredShadow: (color: string, intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
        const alphas = { light: 0.1, medium: 0.2, heavy: 0.3 };
        return `0 4px 12px ${rgba(color, alphas[intensity])}`;
      },
    },

    // Focus utilities
    focus: {
      // Accessible focus styles
      ring: (color: string = theme.colors.primary) => ({
        outline: 'none',
        boxShadow: `0 0 0 3px ${rgba(color, 0.2)}`,
      }),

      // Custom focus for different components
      button: {
        outline: 'none',
        boxShadow: `0 0 0 3px ${rgba(theme.colors.primary, 0.2)}`,
        borderColor: theme.colors.primary,
      },

      input: {
        outline: 'none',
        borderColor: theme.colors.primary,
        boxShadow: `0 0 0 3px ${rgba(theme.colors.primary, 0.1)}`,
      },
    },
  };
};

export default useStyledTheme;
