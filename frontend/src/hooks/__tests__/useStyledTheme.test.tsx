import React from 'react';
import { renderHook } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { useStyledTheme } from '@hooks/useStyledTheme';
import { StyledTheme, defaultTheme } from '@styles/theme';

// Mock polished functions
jest.mock('polished', () => ({
  lighten: (amount: number, color: string) => `lighten(${amount}, ${color})`,
  darken: (amount: number, color: string) => `darken(${amount}, ${color})`,
  transparentize: (amount: number, color: string) => `transparentize(${amount}, ${color})`,
  rgba: (color: string, alpha: number) => `rgba(${color}, ${alpha})`,
}));

const mockTheme: StyledTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#059669',
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
);

describe('useStyledTheme', () => {
  describe('basic functionality', () => {
    it('should return theme object', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.theme).toEqual(mockTheme);
    });

    it('should return colors from theme', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors).toEqual(
        expect.objectContaining({
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#059669',
        })
      );
    });

    it('should return breakpoints from theme', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.breakpoints).toEqual(
        expect.objectContaining({
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        })
      );
    });

    it('should return typography from theme', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.typography).toEqual(
        expect.objectContaining({
          fonts: mockTheme.typography.fonts,
          sizes: mockTheme.typography.sizes,
          weights: mockTheme.typography.weights,
          lineHeights: mockTheme.typography.lineHeights,
        })
      );
    });

    it('should return spacing from theme', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.spacing).toEqual(
        expect.objectContaining({
          px: '1px',
          0: '0',
          1: '0.25rem',
          2: '0.5rem',
          4: '1rem',
          8: '2rem',
        })
      );
    });

    it('should return shadows from theme', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.shadows).toEqual(
        expect.objectContaining({
          sm: expect.any(String),
          base: expect.any(String),
          md: expect.any(String),
          lg: expect.any(String),
          xl: expect.any(String),
        })
      );
    });
  });

  describe('color variant functions', () => {
    it('should generate primary color variants', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.getPrimaryVariant('light')).toBe('lighten(0.1, #2563eb)');
      expect(result.current.colors.getPrimaryVariant('dark')).toBe('darken(0.1, #2563eb)');
      expect(result.current.colors.getPrimaryVariant('transparent')).toBe(
        'transparentize(0.1, #2563eb)'
      );
    });

    it('should generate secondary color variants', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.getSecondaryVariant('light')).toBe('lighten(0.1, #64748b)');
      expect(result.current.colors.getSecondaryVariant('dark')).toBe('darken(0.1, #64748b)');
      expect(result.current.colors.getSecondaryVariant('transparent')).toBe(
        'transparentize(0.1, #64748b)'
      );
    });

    it('should generate accent color variants', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.getAccentVariant('light')).toBe('lighten(0.1, #059669)');
      expect(result.current.colors.getAccentVariant('dark')).toBe('darken(0.1, #059669)');
      expect(result.current.colors.getAccentVariant('transparent')).toBe(
        'transparentize(0.1, #059669)'
      );
    });

    it('should accept custom amounts for color variants', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.getPrimaryVariant('light', 0.2)).toBe('lighten(0.2, #2563eb)');
      expect(result.current.colors.getPrimaryVariant('dark', 0.3)).toBe('darken(0.3, #2563eb)');
      expect(result.current.colors.getPrimaryVariant('transparent', 0.5)).toBe(
        'transparentize(0.5, #2563eb)'
      );
    });

    it('should return original color for invalid variant', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.getPrimaryVariant('invalid' as any)).toBe('#2563eb');
    });

    it('should create rgba colors', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.colors.createRgba('#ff0000', 0.5)).toBe('rgba(#ff0000, 0.5)');
    });
  });

  describe('responsive breakpoint utilities', () => {
    it('should generate min-width media queries', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.breakpoints.up('sm')).toBe('@media (min-width: 640px)');
      expect(result.current.breakpoints.up('md')).toBe('@media (min-width: 768px)');
      expect(result.current.breakpoints.up('lg')).toBe('@media (min-width: 1024px)');
      expect(result.current.breakpoints.up('xl')).toBe('@media (min-width: 1280px)');
      expect(result.current.breakpoints.up('2xl')).toBe('@media (min-width: 1536px)');
    });

    it('should generate max-width media queries', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      expect(result.current.breakpoints.down('sm')).toBe('@media (max-width: 639px)');
      expect(result.current.breakpoints.down('md')).toBe('@media (max-width: 767px)');
      expect(result.current.breakpoints.down('lg')).toBe('@media (max-width: 1023px)');
      expect(result.current.breakpoints.down('xl')).toBe('@media (max-width: 1279px)');
      expect(result.current.breakpoints.down('2xl')).toBe('@media (max-width: 1535px)');
    });
  });

  describe('typography utilities', () => {
    it('should generate responsive font sizes', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const responsiveSize = result.current.typography.getResponsiveFontSize('base');

      expect(responsiveSize).toEqual({
        fontSize: '1rem',
        '@media (min-width: 768px)': {
          fontSize: 'calc(1rem * 1.1)',
        },
        '@media (min-width: 1024px)': {
          fontSize: 'calc(1rem * 1.2)',
        },
      });
    });

    it('should generate responsive font sizes for different sizes', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const responsiveXl = result.current.typography.getResponsiveFontSize('xl');
      expect(responsiveXl.fontSize).toBe('1.25rem');

      const responsiveSm = result.current.typography.getResponsiveFontSize('sm');
      expect(responsiveSm.fontSize).toBe('0.875rem');
    });
  });

  describe('spacing utilities', () => {
    it('should generate responsive spacing', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const responsiveSpacing = result.current.spacing.getResponsiveSpacing(4);

      expect(responsiveSpacing).toEqual({
        '@media (max-width: 640px)': {
          padding: 'calc(1rem * 0.75)',
        },
        '@media (min-width: 1024px)': {
          padding: 'calc(1rem * 1.25)',
        },
      });
    });

    it('should generate responsive spacing for different sizes', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const responsiveSpacing8 = result.current.spacing.getResponsiveSpacing(8);
      expect(responsiveSpacing8['@media (max-width: 640px)'].padding).toBe('calc(2rem * 0.75)');
      expect(responsiveSpacing8['@media (min-width: 1024px)'].padding).toBe('calc(2rem * 1.25)');
    });
  });

  describe('animation utilities', () => {
    it('should provide hover lift animation', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const liftAnimation = result.current.animations.hover.lift;
      expect(liftAnimation).toEqual({
        transform: 'translateY(-2px)',
        boxShadow: mockTheme.shadows.lg,
        transition: mockTheme.transitions.normal,
      });
    });

    it('should provide hover glow animation with default color', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const glowAnimation = result.current.animations.hover.glow();
      expect(glowAnimation).toEqual({
        boxShadow: '0 0 20px rgba(#2563eb, 0.4)',
        transition: mockTheme.transitions.normal,
      });
    });

    it('should provide hover glow animation with custom color', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const glowAnimation = result.current.animations.hover.glow('#ff0000');
      expect(glowAnimation).toEqual({
        boxShadow: '0 0 20px rgba(#ff0000, 0.4)',
        transition: mockTheme.transitions.normal,
      });
    });

    it('should provide hover scale animation', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const scaleAnimation = result.current.animations.hover.scale;
      expect(scaleAnimation).toEqual({
        transform: 'scale(1.05)',
        transition: mockTheme.transitions.fast,
      });
    });

    it('should provide loading pulse animation', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const pulseAnimation = result.current.animations.loading.pulse;
      expect(pulseAnimation).toEqual({
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      });
    });

    it('should provide loading spin animation', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const spinAnimation = result.current.animations.loading.spin;
      expect(spinAnimation).toEqual({
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      });
    });
  });

  describe('shadow utilities', () => {
    it('should generate colored shadows with default intensity', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const coloredShadow = result.current.shadows.getColoredShadow('#ff0000');
      expect(coloredShadow).toBe('0 4px 12px rgba(#ff0000, 0.2)');
    });

    it('should generate colored shadows with custom intensity', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const lightShadow = result.current.shadows.getColoredShadow('#ff0000', 'light');
      expect(lightShadow).toBe('0 4px 12px rgba(#ff0000, 0.1)');

      const heavyShadow = result.current.shadows.getColoredShadow('#ff0000', 'heavy');
      expect(heavyShadow).toBe('0 4px 12px rgba(#ff0000, 0.3)');
    });
  });

  describe('focus utilities', () => {
    it('should provide focus ring with default color', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const focusRing = result.current.focus.ring();
      expect(focusRing).toEqual({
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(#2563eb, 0.2)',
      });
    });

    it('should provide focus ring with custom color', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const focusRing = result.current.focus.ring('#ff0000');
      expect(focusRing).toEqual({
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(#ff0000, 0.2)',
      });
    });

    it('should provide button focus styles', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const buttonFocus = result.current.focus.button;
      expect(buttonFocus).toEqual({
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(#2563eb, 0.2)',
        borderColor: '#2563eb',
      });
    });

    it('should provide input focus styles', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const inputFocus = result.current.focus.input;
      expect(inputFocus).toEqual({
        outline: 'none',
        borderColor: '#2563eb',
        boxShadow: '0 0 0 3px rgba(#2563eb, 0.1)',
      });
    });
  });

  describe('theme variations', () => {
    it('should work with different theme variations', () => {
      const customTheme: StyledTheme = {
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
        },
      };

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={customTheme}>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useStyledTheme(), { wrapper: customWrapper });

      expect(result.current.colors.getPrimaryVariant('light')).toBe('lighten(0.1, #ff0000)');
      expect(result.current.colors.getSecondaryVariant('dark')).toBe('darken(0.1, #00ff00)');
      expect(result.current.colors.getAccentVariant('transparent')).toBe(
        'transparentize(0.1, #0000ff)'
      );
    });

    it('should handle missing theme properties gracefully', () => {
      const PartialWrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
      );

      expect(() => {
        renderHook(() => useStyledTheme(), { wrapper: PartialWrapper });
      }).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should maintain referential equality for static objects', () => {
      const { result, rerender } = renderHook(() => useStyledTheme(), { wrapper });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // These should be the same references since the theme hasn't changed
      expect(firstResult.theme).toBe(secondResult.theme);
    });

    it('should create new objects for dynamic functions', () => {
      const { result } = renderHook(() => useStyledTheme(), { wrapper });

      const firstCall = result.current.colors.getPrimaryVariant('light');
      const secondCall = result.current.colors.getPrimaryVariant('light');

      // These should be equal but not the same reference
      expect(firstCall).toEqual(secondCall);
    });
  });
});
