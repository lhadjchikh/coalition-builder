import React from 'react';
import { render } from '@testing-library/react';
import { ThemeStyles } from '@components/ThemeStyles';
import { Theme } from '@shared/utils/theme';

// Mock the generateCSSVariables function
jest.mock('@shared/utils/theme', () => ({
  generateCSSVariables: jest.fn(theme => {
    if (!theme) return ':root { --theme-primary: #2563eb; }';
    return `:root { --theme-primary: ${theme.primary_color}; }`;
  }),
}));

describe('ThemeStyles', () => {
  const mockTheme: Theme = {
    id: 1,
    name: 'Test Theme',
    primary_color: '#ff0000',
    secondary_color: '#00ff00',
    accent_color: '#0000ff',
    background_color: '#ffffff',
    section_background_color: '#f5f5f5',
    card_background_color: '#ffffff',
    heading_color: '#333333',
    body_text_color: '#666666',
    muted_text_color: '#999999',
    link_color: '#0066cc',
    link_hover_color: '#0052a3',
    heading_font_family: 'Arial, sans-serif',
    body_font_family: 'Helvetica, sans-serif',
    google_fonts: [],
    font_size_base: 1,
    font_size_small: 0.875,
    font_size_large: 1.25,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('should render style tag with theme CSS when theme is provided', () => {
    const { container } = render(<ThemeStyles theme={mockTheme} />);

    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(':root { --theme-primary: #ff0000; }');
  });

  it('should render style tag with default CSS when theme is null', () => {
    const { container } = render(<ThemeStyles theme={null} />);

    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(':root { --theme-primary: #2563eb; }');
  });

  it('should render style tag with default CSS when theme is undefined', () => {
    const { container } = render(<ThemeStyles />);

    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(':root { --theme-primary: #2563eb; }');
  });

  it('should pass theme correctly to generateCSSVariables', () => {
    const { generateCSSVariables } = require('@shared/utils/theme');

    render(<ThemeStyles theme={mockTheme} />);

    expect(generateCSSVariables).toHaveBeenCalledWith(mockTheme);
  });

  it('should handle null theme with nullish coalescing', () => {
    const { generateCSSVariables } = require('@shared/utils/theme');

    render(<ThemeStyles theme={null} />);

    expect(generateCSSVariables).toHaveBeenCalledWith(null);
  });
});
