import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import { Theme } from '@shared/utils/theme';

// Mock the loadGoogleFonts function
jest.mock('@shared/utils/googleFonts');
import { loadGoogleFonts } from '@shared/utils/googleFonts';
const mockLoadGoogleFonts = loadGoogleFonts as jest.MockedFunction<typeof loadGoogleFonts>;

// Test component that uses CSS custom properties set by the theme
const FontTestComponent: React.FC = () => {
  return (
    <div data-testid="font-test-component">
      <h1
        data-testid="heading"
        style={{
          fontFamily: 'var(--theme-font-heading)',
          fontSize: 'var(--theme-font-size-large)',
        }}
      >
        Test Heading with Google Font
      </h1>
      <p
        data-testid="body-text"
        style={{ fontFamily: 'var(--theme-font-body)', fontSize: 'var(--theme-font-size-base)' }}
      >
        Test body text with Google Font
      </p>
      <small
        data-testid="small-text"
        style={{ fontFamily: 'var(--theme-font-body)', fontSize: 'var(--theme-font-size-small)' }}
      >
        Small text with Google Font
      </small>
    </div>
  );
};

const createMockTheme = (overrides: Partial<Theme> = {}): Theme => ({
  id: 1,
  name: 'Google Fonts Test Theme',
  description: 'Theme for testing Google Fonts integration',
  primary_color: '#2563eb',
  secondary_color: '#64748b',
  accent_color: '#059669',
  background_color: '#ffffff',
  section_background_color: '#f9fafb',
  card_background_color: '#ffffff',
  heading_color: '#111827',
  body_text_color: '#374151',
  muted_text_color: '#6b7280',
  link_color: '#2563eb',
  link_hover_color: '#1d4ed8',
  heading_font_family: "'Roboto', sans-serif",
  body_font_family: "'Open Sans', sans-serif",
  google_fonts: ['Roboto', 'Open Sans'],
  font_size_base: 1.0,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: undefined,
  logo_alt_text: undefined,
  favicon_url: undefined,
  custom_css: undefined,
  is_active: true,
  created_at: '2025-01-04T12:00:00Z',
  updated_at: '2025-01-04T12:00:00Z',
  ...overrides,
});

describe('Google Fonts Integration in Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document styles
    document.documentElement.style.cssText = '';
  });

  it('should load Google Fonts and apply CSS custom properties for typography', async () => {
    const theme = createMockTheme({
      google_fonts: ['Merriweather', 'Barlow'],
      heading_font_family: "'Merriweather', serif",
      body_font_family: "'Barlow', sans-serif",
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    // Wait for Google Fonts to be loaded
    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });

    // Check that CSS custom properties are set correctly
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Merriweather', serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Barlow', sans-serif");
    expect(root.style.getPropertyValue('--theme-font-size-base')).toBe('1rem');
    expect(root.style.getPropertyValue('--theme-font-size-small')).toBe('0.875rem');
    expect(root.style.getPropertyValue('--theme-font-size-large')).toBe('1.125rem');

    // Verify components are rendered
    expect(screen.getByTestId('heading')).toBeInTheDocument();
    expect(screen.getByTestId('body-text')).toBeInTheDocument();
    expect(screen.getByTestId('small-text')).toBeInTheDocument();
  });

  it('should work with single Google Font for both heading and body', async () => {
    const theme = createMockTheme({
      google_fonts: ['Inter'],
      heading_font_family: "'Inter', sans-serif",
      body_font_family: "'Inter', sans-serif",
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Inter']);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Inter', sans-serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Inter', sans-serif");
  });

  it('should work with no Google Fonts specified', async () => {
    const theme = createMockTheme({
      google_fonts: [],
      heading_font_family: 'serif',
      body_font_family: 'sans-serif',
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(
      () => {
        expect(mockLoadGoogleFonts).not.toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe('serif');
    expect(root.style.getPropertyValue('--theme-font-body')).toBe('sans-serif');
  });

  it('should handle font size changes correctly', async () => {
    const theme = createMockTheme({
      google_fonts: ['Nunito'],
      heading_font_family: "'Nunito', sans-serif",
      body_font_family: "'Nunito', sans-serif",
      font_size_base: 1.2,
      font_size_small: 1.0,
      font_size_large: 1.5,
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Nunito']);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-size-base')).toBe('1.2rem');
    expect(root.style.getPropertyValue('--theme-font-size-small')).toBe('1rem');
    expect(root.style.getPropertyValue('--theme-font-size-large')).toBe('1.5rem');
  });

  it('should handle multiple Google Fonts with complex names', async () => {
    const theme = createMockTheme({
      google_fonts: ['Playfair Display', 'Source Sans Pro', 'Noto Sans JP'],
      heading_font_family: "'Playfair Display', serif",
      body_font_family: "'Source Sans Pro', sans-serif",
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith([
        'Playfair Display',
        'Source Sans Pro',
        'Noto Sans JP',
      ]);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Playfair Display', serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Source Sans Pro', sans-serif");
  });

  it('should handle theme updates and reload fonts', async () => {
    const initialTheme = createMockTheme({
      google_fonts: ['Roboto'],
      heading_font_family: "'Roboto', sans-serif",
      body_font_family: "'Roboto', sans-serif",
    });

    const ThemeUpdateComponent: React.FC = () => {
      const { theme, setTheme } = useTheme();
      const [hasUpdated, setHasUpdated] = React.useState(false);

      React.useEffect(() => {
        // Wait for initial theme to load, then update it
        if (theme && !hasUpdated) {
          setTimeout(() => {
            const updatedTheme = createMockTheme({
              google_fonts: ['Lato', 'Montserrat'],
              heading_font_family: "'Montserrat', sans-serif",
              body_font_family: "'Lato', sans-serif",
            });
            setTheme(updatedTheme);
            setHasUpdated(true);
          }, 100);
        }
      }, [theme, setTheme, hasUpdated]);

      return <FontTestComponent />;
    };

    render(
      <ThemeProvider initialTheme={initialTheme}>
        <ThemeUpdateComponent />
      </ThemeProvider>
    );

    // Verify initial fonts are loaded
    await waitFor(
      () => {
        expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Roboto']);
      },
      { timeout: 1000 }
    );

    // Wait for theme update and verify new fonts are loaded
    await waitFor(
      () => {
        expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Lato', 'Montserrat']);
      },
      { timeout: 2000 }
    );

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Montserrat', sans-serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Lato', sans-serif");
  });

  it('should handle decimal font sizes correctly', async () => {
    const theme = createMockTheme({
      google_fonts: ['Inter'],
      heading_font_family: "'Inter', sans-serif",
      body_font_family: "'Inter', sans-serif",
      font_size_base: 1.125,
      font_size_small: 0.875,
      font_size_large: 1.5,
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Inter']);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-size-base')).toBe('1.125rem');
    expect(root.style.getPropertyValue('--theme-font-size-small')).toBe('0.875rem');
    expect(root.style.getPropertyValue('--theme-font-size-large')).toBe('1.5rem');
  });

  it('should work without initial theme and load fonts from API', async () => {
    const theme = createMockTheme({
      google_fonts: ['Poppins'],
      heading_font_family: "'Poppins', sans-serif",
      body_font_family: "'Poppins', sans-serif",
    });

    // Mock fetch for theme API
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => theme,
    });

    render(
      <ThemeProvider>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Poppins']);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Poppins', sans-serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Poppins', sans-serif");
  });

  it('should gracefully handle webfontloader failures', async () => {
    // Mock console to avoid error output in tests
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

    const theme = createMockTheme({
      google_fonts: ['InvalidFont'],
      heading_font_family: "'InvalidFont', sans-serif",
      body_font_family: "'InvalidFont', sans-serif",
    });

    render(
      <ThemeProvider initialTheme={theme}>
        <FontTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['InvalidFont']);
    });

    // Even if fonts fail to load, CSS properties should still be set
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'InvalidFont', sans-serif");
    expect(root.style.getPropertyValue('--theme-font-body')).toBe("'InvalidFont', sans-serif");

    mockConsoleWarn.mockRestore();
  });
});
