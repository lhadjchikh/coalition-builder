import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Router to avoid nested router issues
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
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
