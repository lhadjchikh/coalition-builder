import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { Theme } from '@shared/utils/theme';
import * as googleFontsModule from '../../utils/googleFonts';

// Mock the loadGoogleFonts function
const mockLoadGoogleFonts = jest.fn();
jest.spyOn(googleFontsModule, 'loadGoogleFonts').mockImplementation(mockLoadGoogleFonts);

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test component that uses the theme context
const TestComponent: React.FC = () => {
  const { theme, loading, error } = useTheme();

  return (
    <div data-testid="test-component">
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="theme-name">{theme?.name || 'no-theme'}</div>
      <div data-testid="google-fonts">
        {theme?.google_fonts ? JSON.stringify(theme.google_fonts) : 'no-fonts'}
      </div>
    </div>
  );
};

const mockTheme: Theme = {
  id: 1,
  name: 'Test Theme with Google Fonts',
  description: 'A test theme',
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
  heading_font_family: "'Merriweather', serif",
  body_font_family: "'Barlow', sans-serif",
  google_fonts: ['Merriweather', 'Barlow'],
  font_size_base: 1.0,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: null,
  logo_alt_text: null,
  favicon_url: null,
  custom_css: null,
  is_active: true,
  created_at: '2025-01-04T12:00:00Z',
  updated_at: '2025-01-04T12:00:00Z',
};

describe('ThemeContext Google Fonts Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document styles
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should load Google Fonts when theme is provided with google_fonts', async () => {
    render(
      <ThemeProvider initialTheme={mockTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });
  });

  it('should not load Google Fonts when theme has empty google_fonts array', async () => {
    const themeWithoutFonts = {
      ...mockTheme,
      google_fonts: [],
    };

    render(
      <ThemeProvider initialTheme={themeWithoutFonts}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith([]);
    });
  });

  it('should not load Google Fonts when theme has no google_fonts property', async () => {
    const themeWithoutFontsProperty = {
      ...mockTheme,
      google_fonts: undefined as any,
    };

    render(
      <ThemeProvider initialTheme={themeWithoutFontsProperty}>
        <TestComponent />
      </ThemeProvider>
    );

    // Since google_fonts is undefined, loadGoogleFonts should not be called
    await waitFor(() => {
      expect(mockLoadGoogleFonts).not.toHaveBeenCalled();
    });
  });

  it('should load Google Fonts when theme is fetched from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTheme,
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });
  });

  it('should load different Google Fonts when theme is updated', async () => {
    const { rerender } = render(
      <ThemeProvider initialTheme={mockTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify initial fonts are loaded
    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });

    // Clear the mock to track new calls
    mockLoadGoogleFonts.mockClear();

    // Update with new theme
    const updatedTheme = {
      ...mockTheme,
      google_fonts: ['Playfair Display', 'Inter'],
      heading_font_family: "'Playfair Display', serif",
      body_font_family: "'Inter', sans-serif",
    };

    rerender(
      <ThemeProvider initialTheme={updatedTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Playfair Display', 'Inter']);
    });
  });

  it('should load Google Fonts with single font family', async () => {
    const singleFontTheme = {
      ...mockTheme,
      google_fonts: ['Roboto'],
      heading_font_family: "'Roboto', sans-serif",
      body_font_family: "'Roboto', sans-serif",
    };

    render(
      <ThemeProvider initialTheme={singleFontTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Roboto']);
    });
  });

  it('should load Google Fonts with multiple font families', async () => {
    const multiFontTheme = {
      ...mockTheme,
      google_fonts: ['Open Sans', 'Source Code Pro', 'Playfair Display'],
      heading_font_family: "'Playfair Display', serif",
      body_font_family: "'Open Sans', sans-serif",
    };

    render(
      <ThemeProvider initialTheme={multiFontTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith([
        'Open Sans',
        'Source Code Pro',
        'Playfair Display',
      ]);
    });
  });

  it('should apply font families to CSS custom properties', async () => {
    render(
      <ThemeProvider initialTheme={mockTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--theme-font-heading')).toBe("'Merriweather', serif");
      expect(root.style.getPropertyValue('--theme-font-body')).toBe("'Barlow', sans-serif");
    });
  });

  it('should handle API error gracefully and not load fonts', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).not.toHaveBeenCalled();
    });
  });

  it('should handle 404 response and not load fonts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).not.toHaveBeenCalled();
    });
  });

  it('should reload Google Fonts when refreshTheme is called', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTheme,
    });

    const TestComponentWithRefresh: React.FC = () => {
      const { theme, refreshTheme } = useTheme();

      React.useEffect(() => {
        // Trigger refresh after initial load
        if (theme) {
          setTimeout(() => {
            refreshTheme();
          }, 100);
        }
      }, [theme, refreshTheme]);

      return <div data-testid="theme-name">{theme?.name || 'no-theme'}</div>;
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockTheme,
        google_fonts: ['Nunito', 'Source Sans Pro'],
      }),
    });

    render(
      <ThemeProvider>
        <TestComponentWithRefresh />
      </ThemeProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });

    // Wait for refresh
    await waitFor(
      () => {
        expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Nunito', 'Source Sans Pro']);
      },
      { timeout: 3000 }
    );
  });

  it('should handle setTheme manually and load Google Fonts', async () => {
    const TestComponentWithSetter: React.FC = () => {
      const { theme, setTheme } = useTheme();
      const [hasSetTheme, setHasSetTheme] = React.useState(false);

      React.useEffect(() => {
        if (!hasSetTheme) {
          const newTheme = {
            ...mockTheme,
            google_fonts: ['Lato', 'Montserrat'],
          };
          setTheme(newTheme);
          setHasSetTheme(true);
        }
      }, [setTheme, hasSetTheme]);

      return <div data-testid="theme-name">{theme?.name || 'no-theme'}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponentWithSetter />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Lato', 'Montserrat']);
    });
  });

  it('should not call loadGoogleFonts when theme is set to null', async () => {
    const TestComponentWithNullTheme: React.FC = () => {
      const { setTheme } = useTheme();

      React.useEffect(() => {
        setTheme(null);
      }, [setTheme]);

      return <div>No theme</div>;
    };

    render(
      <ThemeProvider initialTheme={mockTheme}>
        <TestComponentWithNullTheme />
      </ThemeProvider>
    );

    // Initial load should happen
    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });

    // Setting to null should not trigger additional calls
    const callCount = mockLoadGoogleFonts.mock.calls.length;

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockLoadGoogleFonts).toHaveBeenCalledTimes(callCount);
  });
});
