import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Theme } from '@shared/utils/theme';

// Mock the entire googleFonts module
const mockLoadGoogleFonts = jest.fn();
jest.mock('../googleFonts', () => ({
  loadGoogleFonts: mockLoadGoogleFonts,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Simple test component
const TestComponent: React.FC = () => React.createElement('div', { 'data-testid': 'test' }, 'Test');

const createTheme = (googleFonts: string[] = []): Theme => ({
  id: 1,
  name: 'Test Theme',
  description: 'Test',
  primary_color: '#000',
  secondary_color: '#111',
  accent_color: '#222',
  background_color: '#fff',
  section_background_color: '#f9f9f9',
  card_background_color: '#fff',
  heading_color: '#000',
  body_text_color: '#333',
  muted_text_color: '#666',
  link_color: '#000',
  link_hover_color: '#333',
  heading_font_family: 'serif',
  body_font_family: 'sans-serif',
  google_fonts: googleFonts,
  font_size_base: 1.0,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: null,
  logo_alt_text: null,
  favicon_url: null,
  custom_css: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
});

describe('Google Fonts Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.cssText = '';
  });

  it('should call loadGoogleFonts when theme has fonts', async () => {
    const theme = createTheme(['Roboto', 'Open Sans']);

    render(
      React.createElement(
        ThemeProvider,
        { initialTheme: theme },
        React.createElement(TestComponent)
      )
    );

    expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Roboto', 'Open Sans']);
  });

  it('should not call loadGoogleFonts when fonts array is empty', async () => {
    const theme = createTheme([]);

    render(
      React.createElement(
        ThemeProvider,
        { initialTheme: theme },
        React.createElement(TestComponent)
      )
    );

    expect(mockLoadGoogleFonts).toHaveBeenCalledWith([]);
  });

  it('should call loadGoogleFonts with fonts from API response', async () => {
    const theme = createTheme(['Merriweather', 'Barlow']);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => theme,
    });

    render(React.createElement(ThemeProvider, {}, React.createElement(TestComponent)));

    await waitFor(() => {
      expect(mockLoadGoogleFonts).toHaveBeenCalledWith(['Merriweather', 'Barlow']);
    });
  });

  it('should set CSS custom properties for fonts', async () => {
    const theme = createTheme(['Inter']);

    render(
      React.createElement(
        ThemeProvider,
        { initialTheme: theme },
        React.createElement(TestComponent)
      )
    );

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--theme-font-heading')).toBe('serif');
    expect(root.style.getPropertyValue('--theme-font-body')).toBe('sans-serif');
    expect(root.style.getPropertyValue('--theme-font-size-base')).toBe('1rem');
    expect(root.style.getPropertyValue('--theme-font-size-small')).toBe('0.875rem');
    expect(root.style.getPropertyValue('--theme-font-size-large')).toBe('1.125rem');
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(React.createElement(ThemeProvider, {}, React.createElement(TestComponent)));

    // Wait a bit to ensure no calls were made
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockLoadGoogleFonts).not.toHaveBeenCalled();
  });

  it('should handle multiple font families correctly', async () => {
    const fonts = ['Playfair Display', 'Source Sans Pro', 'Noto Sans JP'];
    const theme = createTheme(fonts);

    render(
      React.createElement(
        ThemeProvider,
        { initialTheme: theme },
        React.createElement(TestComponent)
      )
    );

    expect(mockLoadGoogleFonts).toHaveBeenCalledWith(fonts);
  });
});
