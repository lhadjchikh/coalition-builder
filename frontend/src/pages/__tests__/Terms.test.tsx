import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Terms from '@pages/Terms';
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

describe('Terms', () => {
  const mockTermsData = {
    document_type: 'terms_of_use',
    content: '<h1>Terms of Use</h1><p>These are our terms of use.</p>',
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

  it('renders terms of use successfully', async () => {
    (API.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading Terms of Use...')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading Terms of Use...')).not.toBeInTheDocument();
    });

    // Check that content is rendered
    const content = screen.getByRole('article');
    expect(content).toBeInTheDocument();
    expect(content.innerHTML).toContain('Terms of Use');
    expect(content.innerHTML).toContain('These are our terms of use.');

    // Check that navbar and footer are rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (API.getTermsOfUse as jest.Mock).mockRejectedValue(new Error('API Error'));
    (API.getHomepage as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Failed to load Terms of Use. Please try again later.')
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders without homepage data', async () => {
    (API.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);
    (API.getHomepage as jest.Mock).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Terms of Use...')).not.toBeInTheDocument();
    });

    // Should still render content but no navbar/footer
    const content = screen.getByRole('article');
    expect(content).toBeInTheDocument();
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('makes correct API calls on mount', () => {
    (API.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    expect(API.getTermsOfUse).toHaveBeenCalledTimes(1);
    expect(API.getHomepage).toHaveBeenCalledTimes(1);
  });

  it('uses dangerouslySetInnerHTML for content rendering', async () => {
    (API.getTermsOfUse as jest.Mock).mockResolvedValue(mockTermsData);
    (API.getHomepage as jest.Mock).mockResolvedValue(mockHomepageData);

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading Terms of Use...')).not.toBeInTheDocument();
    });

    const contentDiv = screen.getByRole('article').querySelector('.legal-content');
    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv?.innerHTML).toBe(mockTermsData.content);
  });
});
