import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { Theme } from '@shared/utils/theme';

// Mock test theme to provide to ThemeProvider
const mockTheme: Theme = {
  id: 1,
  name: 'Test Theme',
  description: 'Test theme',
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
  google_fonts: [],
  font_size_base: 1,
  font_size_small: 0.875,
  font_size_large: 1.125,
  logo_url: '',
  logo_alt_text: '',
  favicon_url: '',
  custom_css: '',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Mock ThemeProvider to provide initial theme and avoid async operations
jest.mock('./contexts/ThemeContext', () => {
  const actual = jest.requireActual('./contexts/ThemeContext');
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => {
      const { ThemeProvider: ActualProvider } = jest.requireActual('./contexts/ThemeContext');
      return <ActualProvider initialTheme={mockTheme}>{children}</ActualProvider>;
    },
  };
});

// Mock Router to avoid nested router issues
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
}));

// Mock the API module to prevent actual network requests
jest.mock('./services/api', () => ({
  api: {
    theme: {
      getActive: jest.fn().mockRejectedValue(new Error('No active theme')),
    },
  },
}));

// Mock page components to focus on App's routing responsibilities
jest.mock('./pages/Home', () => {
  return function MockHome() {
    return <div data-testid="home-page">Mock Home Page</div>;
  };
});

jest.mock('./pages/About', () => {
  return function MockAbout() {
    return <div data-testid="about-page">Mock About Page</div>;
  };
});

jest.mock('./pages/Campaigns', () => {
  return function MockCampaigns() {
    return <div data-testid="campaigns-page">Mock Campaigns Page</div>;
  };
});

jest.mock('./pages/Contact', () => {
  return function MockContact() {
    return <div data-testid="contact-page">Mock Contact Page</div>;
  };
});

jest.mock('./pages/CampaignDetail', () => {
  return function MockCampaignDetail() {
    return <div data-testid="campaign-detail-page">Mock Campaign Detail Page</div>;
  };
});

jest.mock('./components/GoogleAnalytics', () => {
  return function MockGoogleAnalytics() {
    return <div data-testid="google-analytics">Mock Google Analytics</div>;
  };
});

jest.mock('@shared/components/CookieConsent', () => {
  return function MockCookieConsent() {
    return <div data-testid="cookie-consent">Mock Cookie Consent</div>;
  };
});

describe('App component', () => {
  test('renders app structure with all components', () => {
    render(<App />);

    // App wrapper should exist
    const appDiv = document.querySelector('.App');
    expect(appDiv).toBeInTheDocument();

    // All components should be rendered through the mocked router
    expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders about page component', () => {
    render(<App />);

    expect(screen.getByTestId('about-page')).toBeInTheDocument();
  });

  test('renders campaigns page component', () => {
    render(<App />);

    expect(screen.getByTestId('campaigns-page')).toBeInTheDocument();
  });

  test('renders contact page component', () => {
    render(<App />);

    expect(screen.getByTestId('contact-page')).toBeInTheDocument();
  });

  test('renders campaign detail page component', () => {
    render(<App />);

    expect(screen.getByTestId('campaign-detail-page')).toBeInTheDocument();
  });
});
