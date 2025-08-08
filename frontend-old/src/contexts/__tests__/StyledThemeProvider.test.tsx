import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnhancedThemeProvider } from '@contexts/StyledThemeProvider';
import { useTheme } from '@contexts/ThemeContext';
import { Theme } from '@app-types/index';

// Mock the ThemeContext
jest.mock('@contexts/ThemeContext');
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

// Mock polished functions
jest.mock('polished', () => ({
  lighten: (amount: number, color: string) => `lighten(${amount}, ${color})`,
  darken: (amount: number, color: string) => `darken(${amount}, ${color})`,
}));

// Mock styled-components
jest.mock('styled-components', () => ({
  ThemeProvider: ({ children, theme }: { children: React.ReactNode; theme: any }) => (
    <div data-testid="styled-theme-provider" data-theme={JSON.stringify(theme)}>
      {children}
    </div>
  ),
  createGlobalStyle: () => () => <style data-testid="global-style" />,
}));

const mockTheme: Theme = {
  id: 1,
  name: 'Test Theme',
  description: 'Test theme description',
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
  heading_font_family: 'Inter, sans-serif',
  body_font_family: 'Inter, sans-serif',
  google_fonts: ['Inter'],
  font_size_base: 1,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: 'https://example.com/logo.png',
  logo_alt_text: 'Test Logo',
  favicon_url: 'https://example.com/favicon.ico',
  custom_css: '.custom { color: red; }',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('EnhancedThemeProvider', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.head.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading message when theme is loading', () => {
      mockUseTheme.mockReturnValue({
        theme: null,
        loading: true,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      expect(screen.getByText('Loading theme...')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should render children when not loading', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      expect(screen.queryByText('Loading theme...')).not.toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('theme creation and enhancement', () => {
    it('should create styled theme with database theme', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      const themeProvider = screen.getByTestId('styled-theme-provider');
      const themeData = JSON.parse(themeProvider.getAttribute('data-theme') || '{}');

      expect(themeData.colors.primary).toBe('#2563eb');
      expect(themeData.colors.secondary).toBe('#64748b');
      expect(themeData.colors.accent).toBe('#059669');
    });

    it('should enhance theme with polished color variations', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      const themeProvider = screen.getByTestId('styled-theme-provider');
      const themeData = JSON.parse(themeProvider.getAttribute('data-theme') || '{}');

      expect(themeData.colors.primaryLight).toBe('lighten(0.1, #2563eb)');
      expect(themeData.colors.primaryDark).toBe('darken(0.1, #2563eb)');
      expect(themeData.colors.secondaryLight).toBe('lighten(0.1, #64748b)');
      expect(themeData.colors.secondaryDark).toBe('darken(0.1, #64748b)');
      expect(themeData.colors.accentLight).toBe('lighten(0.1, #059669)');
      expect(themeData.colors.accentDark).toBe('darken(0.1, #059669)');
    });

    it('should create default theme when no database theme provided', () => {
      mockUseTheme.mockReturnValue({
        theme: null,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      const themeProvider = screen.getByTestId('styled-theme-provider');
      const themeData = JSON.parse(themeProvider.getAttribute('data-theme') || '{}');

      // Should have default colors
      expect(themeData.colors).toBeDefined();
      expect(themeData.typography).toBeDefined();
      expect(themeData.spacing).toBeDefined();
    });

    it('should handle invalid theme data gracefully', () => {
      // Mock a theme with invalid data
      const badTheme = { ...mockTheme, primary_color: null } as any;
      mockUseTheme.mockReturnValue({
        theme: badTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      // Should still render content even with invalid theme data
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('favicon management', () => {
    it('should update favicon when theme has favicon_url', async () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      await act(async () => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      await act(async () => {
        await waitFor(() => {
          const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          expect(faviconLink).toBeTruthy();
          expect(faviconLink.href).toBe('https://example.com/favicon.ico');
        });
      });
    });

    it('should create favicon link if none exists', async () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      // Ensure no favicon link exists initially
      expect(document.querySelector("link[rel~='icon']")).toBeNull();

      await act(async () => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      await act(async () => {
        await waitFor(() => {
          const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          expect(faviconLink).toBeTruthy();
          expect(faviconLink.rel).toBe('icon');
          expect(faviconLink.href).toBe('https://example.com/favicon.ico');
        });
      });
    });

    it('should update existing favicon link', async () => {
      // Create an existing favicon link
      const existingLink = document.createElement('link');
      existingLink.rel = 'icon';
      existingLink.href = 'https://old-favicon.com/favicon.ico';
      document.head.appendChild(existingLink);

      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      await act(async () => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      await act(async () => {
        await waitFor(() => {
          const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          expect(faviconLink).toBe(existingLink); // Should be the same element
          expect(faviconLink.href).toBe('https://example.com/favicon.ico'); // But with updated href
        });
      });
    });

    it('should not create favicon link when favicon_url is not provided', async () => {
      const themeWithoutFavicon = { ...mockTheme, favicon_url: undefined };
      mockUseTheme.mockReturnValue({
        theme: themeWithoutFavicon,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      await act(async () => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      // Wait a bit to ensure the effect has run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(document.querySelector("link[rel~='icon']")).toBeNull();
    });

    it('should update favicon when theme changes', async () => {
      let rerender: any;
      await act(async () => {
        const result = render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
        rerender = result.rerender;
      });

      // First theme
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      await act(async () => {
        rerender(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      await act(async () => {
        await waitFor(() => {
          const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          expect(faviconLink.href).toBe('https://example.com/favicon.ico');
        });
      });

      // Change theme
      const newTheme = { ...mockTheme, favicon_url: 'https://new-example.com/new-favicon.ico' };
      mockUseTheme.mockReturnValue({
        theme: newTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      await act(async () => {
        rerender(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      });

      await act(async () => {
        await waitFor(() => {
          const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          expect(faviconLink.href).toBe('https://new-example.com/new-favicon.ico');
        });
      });
    });
  });

  describe('global styles', () => {
    it('should render global styles', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('global-style')).toBeInTheDocument();
    });
  });

  describe('theme memoization', () => {
    it('should memoize theme when database theme does not change', () => {
      const { rerender } = render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      rerender(
        <EnhancedThemeProvider>
          <div>Test Content 1</div>
        </EnhancedThemeProvider>
      );

      const firstThemeData = JSON.parse(
        screen.getByTestId('styled-theme-provider').getAttribute('data-theme') || '{}'
      );

      rerender(
        <EnhancedThemeProvider>
          <div>Test Content 2</div>
        </EnhancedThemeProvider>
      );

      const secondThemeData = JSON.parse(
        screen.getByTestId('styled-theme-provider').getAttribute('data-theme') || '{}'
      );

      // Theme objects should be structurally the same
      expect(firstThemeData).toEqual(secondThemeData);
    });

    it('should recreate theme when database theme changes', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      const { rerender } = render(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      const firstThemeData = JSON.parse(
        screen.getByTestId('styled-theme-provider').getAttribute('data-theme') || '{}'
      );

      // Change theme
      const newTheme = { ...mockTheme, primary_color: '#ff0000' };
      mockUseTheme.mockReturnValue({
        theme: newTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      rerender(
        <EnhancedThemeProvider>
          <div>Test Content</div>
        </EnhancedThemeProvider>
      );

      const secondThemeData = JSON.parse(
        screen.getByTestId('styled-theme-provider').getAttribute('data-theme') || '{}'
      );

      expect(firstThemeData.colors.primary).toBe('#2563eb');
      expect(secondThemeData.colors.primary).toBe('#ff0000');
    });
  });

  describe('error handling', () => {
    it('should handle null theme gracefully', () => {
      mockUseTheme.mockReturnValue({
        theme: null,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      expect(() => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      }).not.toThrow();

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle undefined theme gracefully', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined as any,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      expect(() => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      }).not.toThrow();

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle theme context errors gracefully', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: 'Theme loading error',
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      expect(() => {
        render(
          <EnhancedThemeProvider>
            <div>Test Content</div>
          </EnhancedThemeProvider>
        );
      }).not.toThrow();

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('component integration', () => {
    it('should provide theme context to child components', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      const TestComponent = () => {
        return <div data-testid="test-component">Theme provided</div>;
      };

      render(
        <EnhancedThemeProvider>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('styled-theme-provider')).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      mockUseTheme.mockReturnValue({
        theme: mockTheme,
        loading: false,
        error: null,
        setTheme: jest.fn(),
        refreshTheme: jest.fn(),
      });

      render(
        <EnhancedThemeProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </EnhancedThemeProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });
});
