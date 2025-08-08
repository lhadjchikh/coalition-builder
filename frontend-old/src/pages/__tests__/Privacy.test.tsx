import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from '@pages/Privacy';
import API from '@services/api';

// Mock the API
jest.mock('@services/api');

// Mock the shared components
jest.mock('@shared/components/Navbar', () => ({
  __esModule: true,
  default: jest.fn(() => <nav data-testid="navbar">Navbar</nav>),
}));

jest.mock('@shared/components/Footer', () => ({
  __esModule: true,
  default: jest.fn(() => <footer data-testid="footer">Footer</footer>),
}));

jest.mock('@components/LinkWrapper', () => ({
  __esModule: true,
  default: jest.fn(({ children, ...props }) => <a {...props}>{children}</a>),
}));

describe('Privacy', () => {
  const mockPrivacyData = {
    document_type: 'privacy_policy',
    content: '<h1>Privacy Policy</h1><p>This is our privacy policy.</p>',
    effective_date: '2023-01-01',
    version: '1.0',
  };

  const mockHomepageData = {
    organization_name: 'Test Organization',
    tagline: 'Test Tagline',
    description: 'Test Description',
    social_links: [],
    theme: {
      logo_url: '/logo.png',
      logo_alt_text: 'Test Logo',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders privacy policy successfully', async () => {
    (API.getPrivacyPolicy as jest.Mock).mockResolvedValue(mockPrivacyData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading Privacy Policy...')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading Privacy Policy...')).not.toBeInTheDocument();
    });

    // Check that content is rendered
    const content = screen.getByRole('article');
    expect(content).toBeInTheDocument();
    expect(content.innerHTML).toContain('Privacy Policy');
    expect(content.innerHTML).toContain('This is our privacy policy.');

    // Check that navbar and footer are rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (API.getPrivacyPolicy as jest.Mock).mockRejectedValue(new Error('API Error'));
    (API.getHomepage as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Failed to load Privacy Policy. Please try again later.')
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders without homepage data', async () => {
    (API.getPrivacyPolicy as jest.Mock).mockResolvedValue(mockPrivacyData);
    (API.getHomepage as jest.Mock).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Privacy Policy...')).not.toBeInTheDocument();
    });

    // Should still render content but no navbar/footer
    const content = screen.getByRole('article');
    expect(content).toBeInTheDocument();
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('makes correct API calls on mount', () => {
    (API.getPrivacyPolicy as jest.Mock).mockResolvedValue(mockPrivacyData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    expect(API.getPrivacyPolicy).toHaveBeenCalledTimes(1);
    expect(API.getHomepage).toHaveBeenCalledTimes(1);
  });

  it('uses dangerouslySetInnerHTML for content rendering', async () => {
    (API.getPrivacyPolicy as jest.Mock).mockResolvedValue(mockPrivacyData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Privacy Policy...')).not.toBeInTheDocument();
    });

    const contentDiv = screen.getByRole('article').querySelector('.legal-content');
    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv?.innerHTML).toBe(mockPrivacyData.content);
  });
});
