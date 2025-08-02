import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, useLocation, Routes, Route } from 'react-router-dom';
import Footer from '@shared/components/Footer';
import { HomePage } from '@shared/types';
import LinkWrapper from '../LinkWrapper';

// Mock data
const mockHomepage: HomePage = {
  id: 1,
  organization_name: 'Test Organization',
  tagline: 'Test tagline',
  hero_title: 'Hero Title',
  hero_subtitle: 'Hero Subtitle',
  hero_overlay_enabled: false,
  hero_overlay_color: '#000000',
  hero_overlay_opacity: 0.5,
  cta_title: 'CTA Title',
  cta_content: 'CTA Content',
  cta_button_text: 'CTA Button',
  cta_button_url: '/campaigns',
  campaigns_section_title: 'Our Campaigns',
  show_campaigns_section: true,
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

// Component to track navigation
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('Footer navigation', () => {
  it('renders Terms of Use and Privacy Policy links', () => {
    render(
      <BrowserRouter>
        <Footer orgInfo={mockHomepage} />
      </BrowserRouter>
    );

    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('navigates to /terms when Terms of Use is clicked', async () => {
    const user = userEvent.setup();

    // Use the centralized LinkWrapper

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <LocationDisplay />
                <Footer orgInfo={mockHomepage} LinkComponent={LinkWrapper} />
              </div>
            }
          />
          <Route path="/terms" element={<LocationDisplay />} />
          <Route path="/privacy" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify we start at home
    expect(screen.getByTestId('location')).toHaveTextContent('/');

    // Click Terms of Use
    const termsLink = screen.getByText('Terms of Use');
    await user.click(termsLink);

    // Should navigate to /terms
    expect(screen.getByTestId('location')).toHaveTextContent('/terms');
  });

  it('navigates to /privacy when Privacy Policy is clicked', async () => {
    const user = userEvent.setup();

    // Use the centralized LinkWrapper

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <LocationDisplay />
                <Footer orgInfo={mockHomepage} LinkComponent={LinkWrapper} />
              </div>
            }
          />
          <Route path="/terms" element={<LocationDisplay />} />
          <Route path="/privacy" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify we start at home
    expect(screen.getByTestId('location')).toHaveTextContent('/');

    // Click Privacy Policy
    const privacyLink = screen.getByText('Privacy Policy');
    await user.click(privacyLink);

    // Should navigate to /privacy
    expect(screen.getByTestId('location')).toHaveTextContent('/privacy');
  });

  it('uses custom LinkComponent when provided', async () => {
    const mockNavigate = jest.fn();
    const CustomLink: React.FC<{
      to: string;
      children: React.ReactNode;
      className?: string;
    }> = ({ to, children, className }) => (
      <button
        className={className}
        onClick={() => mockNavigate(to)}
        data-testid={`custom-link-${children}`}
      >
        {children}
      </button>
    );

    render(
      <BrowserRouter>
        <Footer orgInfo={mockHomepage} LinkComponent={CustomLink} />
      </BrowserRouter>
    );

    const termsButton = screen.getByTestId('custom-link-Terms of Use');
    await userEvent.click(termsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/terms');
  });

  it('renders links as anchor tags when no LinkComponent is provided', () => {
    render(
      <BrowserRouter>
        <Footer orgInfo={mockHomepage} />
      </BrowserRouter>
    );

    const termsLink = screen.getByText('Terms of Use').closest('a');
    const privacyLink = screen.getByText('Privacy Policy').closest('a');

    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });
});
