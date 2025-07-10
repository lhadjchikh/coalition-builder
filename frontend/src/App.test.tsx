import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock child components to focus on App's responsibilities
jest.mock('./components/CampaignsList', () => {
  return function MockCampaignsList({
    onCampaignSelect,
  }: {
    onCampaignSelect?: (campaign: any) => void;
  }) {
    return (
      <div data-testid="campaigns-list">
        <p>Mock Campaigns List</p>
        <button
          data-testid="mock-campaign-button"
          onClick={() => onCampaignSelect?.({ id: 1, name: 'test', title: 'Test Campaign' })}
        >
          Test Campaign
        </button>
      </div>
    );
  };
});

jest.mock('./components/HomePage', () => {
  return function MockHomePage() {
    return <div data-testid="homepage">Mock HomePage</div>;
  };
});

jest.mock('./components/StyledHomePage', () => {
  return function MockStyledHomePage() {
    return <div data-testid="styled-homepage">Mock StyledHomePage</div>;
  };
});

jest.mock('./components/CampaignDetail', () => {
  return function MockCampaignDetail({ campaignId }: { campaignId?: number }) {
    return <div data-testid="campaign-detail">Mock Campaign Detail for ID: {campaignId}</div>;
  };
});

describe('App component', () => {
  test('renders Coalition Builder title', () => {
    render(<App />);
    const headingElement = screen.getByText(/Coalition Builder/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders navigation elements', () => {
    render(<App />);
    const navButton = screen.getByText(/All Campaigns/i);
    expect(navButton).toBeInTheDocument();
  });

  test('renders demo information', () => {
    render(<App />);
    const demoHeading = screen.getByText(/Frontend Endorsement Demo/i);
    expect(demoHeading).toBeInTheDocument();

    const demoButton1 = screen.getByText(/Demo: View Campaign 1/i);
    const demoButton2 = screen.getByText(/Demo: View Campaign 2/i);
    expect(demoButton1).toBeInTheDocument();
    expect(demoButton2).toBeInTheDocument();
  });

  test('renders all main components', () => {
    render(<App />);

    // Check that all main components are rendered
    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
    expect(screen.getByTestId('styled-homepage')).toBeInTheDocument();
  });

  test('handles campaign selection navigation', () => {
    render(<App />);

    // Initially should show campaigns list view
    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();
    expect(screen.queryByTestId('campaign-detail')).not.toBeInTheDocument();

    // Click on a campaign
    const campaignButton = screen.getByTestId('mock-campaign-button');
    fireEvent.click(campaignButton);

    // Should now show campaign detail view
    expect(screen.queryByTestId('campaigns-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
    expect(screen.getByText(/Mock Campaign Detail for ID: 1/)).toBeInTheDocument();
  });

  test('handles demo navigation buttons', () => {
    render(<App />);

    // Initially should show campaigns list view
    expect(screen.getByTestId('campaigns-list')).toBeInTheDocument();

    // Click demo button for campaign 2
    const demoButton2 = screen.getByText(/Demo: View Campaign 2/i);
    fireEvent.click(demoButton2);

    // Should show campaign detail for ID 2
    expect(screen.queryByTestId('campaigns-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('campaign-detail')).toBeInTheDocument();
    expect(screen.getByText(/Mock Campaign Detail for ID: 2/)).toBeInTheDocument();
  });
});
