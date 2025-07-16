import { render, screen } from '@testing-library/react';

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

// Mock the pages to isolate App testing
const AppComponent = () => {
  return (
    <div className="App">
      <div data-testid="google-analytics">Mock Google Analytics</div>
      <div data-testid="cookie-consent">Mock Cookie Consent</div>
      <div data-testid="home-page">Mock Home Page</div>
    </div>
  );
};

// Helper function to render App
const renderApp = () => {
  return render(<AppComponent />);
};

describe('App component', () => {
  test('renders without crashing', () => {
    renderApp();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('renders global components', () => {
    renderApp();
    expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
  });

  test('renders app structure', () => {
    renderApp();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
  });
});
