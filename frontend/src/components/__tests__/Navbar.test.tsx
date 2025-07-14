import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

describe('Navbar', () => {
  describe('Basic Rendering', () => {
    it('renders with default organization name', () => {
      render(<Navbar />);
      expect(screen.getByText('Coalition Builder')).toBeInTheDocument();
    });

    it('renders with custom organization name', () => {
      render(<Navbar organizationName="Test Organization" />);
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    it('renders default navigation items when no custom items provided', () => {
      render(<Navbar currentView="list" />);
      expect(screen.getByText('All Campaigns')).toBeInTheDocument();
    });

    it('renders breadcrumb when in detail view', () => {
      render(<Navbar currentView="detail" />);
      expect(screen.getByText('→ Campaign Detail')).toBeInTheDocument();
    });

    it('does not render breadcrumb when in list view', () => {
      render(<Navbar currentView="list" />);
      expect(screen.queryByText('→ Campaign Detail')).not.toBeInTheDocument();
    });
  });

  describe('Custom Navigation Items', () => {
    const customNavItems = [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about' },
      { label: 'Contact', onClick: jest.fn() },
    ];

    it('renders custom navigation items', () => {
      render(<Navbar navItems={customNavItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('applies active class to active navigation items', () => {
      render(<Navbar navItems={customNavItems} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveClass('active');
    });

    it('renders links as anchor tags when href is provided', () => {
      render(<Navbar navItems={customNavItems} />);
      const homeLink = screen.getByText('Home');
      expect(homeLink.tagName).toBe('A');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('renders links as buttons when onClick is provided', () => {
      render(<Navbar navItems={customNavItems} />);
      const contactButton = screen.getByText('Contact');
      expect(contactButton.tagName).toBe('BUTTON');
    });

    it('calls onClick handler when custom nav item is clicked', () => {
      const mockOnClick = jest.fn();
      const navItems = [{ label: 'Test', onClick: mockOnClick }];
      render(<Navbar navItems={navItems} />);

      fireEvent.click(screen.getByText('Test'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Frontend App Navigation', () => {
    it('calls onNavigate when navigation item is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(<Navbar currentView="detail" onNavigate={mockOnNavigate} />);

      fireEvent.click(screen.getByText('All Campaigns'));
      expect(mockOnNavigate).toHaveBeenCalledWith('list');
    });

    it('marks current view as active', () => {
      render(<Navbar currentView="list" />);
      const campaignsLink = screen.getByText('All Campaigns');
      expect(campaignsLink).toHaveClass('active');
    });

    it('calls onNavigate when brand/logo is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(
        <Navbar currentView="detail" onNavigate={mockOnNavigate} organizationName="Test Org" />
      );

      fireEvent.click(screen.getByText('Test Org'));
      expect(mockOnNavigate).toHaveBeenCalledWith('list');
    });

    it('renders brand as clickable button with proper accessibility', () => {
      render(<Navbar organizationName="Test Organization" />);
      const brandButton = screen.getByText('Test Organization');

      expect(brandButton.tagName).toBe('BUTTON');
      expect(brandButton).toHaveAttribute('title', 'Go to homepage');
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      // Mock window.matchMedia for mobile viewport tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });

    it('renders mobile menu toggle button with accessibility label', () => {
      render(<Navbar />);
      // The hamburger menu is always in the DOM but hidden on desktop via CSS
      const toggleButton = screen.getByText('☰');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
    });

    it('toggles mobile menu when button is clicked', () => {
      render(<Navbar />);
      const toggleButton = screen.getByText('☰');

      fireEvent.click(toggleButton);
      expect(screen.getByText('✕')).toBeInTheDocument();

      fireEvent.click(screen.getByText('✕'));
      expect(screen.getByText('☰')).toBeInTheDocument();
    });

    it('closes mobile menu when navigation item is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(<Navbar currentView="list" onNavigate={mockOnNavigate} />);

      // Open menu
      fireEvent.click(screen.getByText('☰'));
      expect(screen.getByText('✕')).toBeInTheDocument();

      // Click nav item
      fireEvent.click(screen.getByText('All Campaigns'));

      // Menu should be closed
      expect(screen.getByText('☰')).toBeInTheDocument();
      expect(mockOnNavigate).toHaveBeenCalledWith('list');
    });

    it('closes mobile menu when custom nav item with onClick is clicked', () => {
      const mockOnClick = jest.fn();
      const navItems = [{ label: 'Test', onClick: mockOnClick }];
      render(<Navbar navItems={navItems} />);

      // Open menu
      fireEvent.click(screen.getByText('☰'));
      expect(screen.getByText('✕')).toBeInTheDocument();

      // Click nav item
      fireEvent.click(screen.getByText('Test'));

      // Menu should be closed
      expect(screen.getByText('☰')).toBeInTheDocument();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('closes mobile menu when brand is clicked', () => {
      const mockOnNavigate = jest.fn();
      render(<Navbar onNavigate={mockOnNavigate} organizationName="Test Org" />);

      // Open menu
      fireEvent.click(screen.getByText('☰'));
      expect(screen.getByText('✕')).toBeInTheDocument();

      // Click brand
      fireEvent.click(screen.getByText('Test Org'));

      // Menu should be closed
      expect(screen.getByText('☰')).toBeInTheDocument();
      expect(mockOnNavigate).toHaveBeenCalledWith('list');
    });
  });

  describe('Styled Components Props', () => {
    it('passes transient props correctly to styled components', () => {
      const { container } = render(<Navbar />);
      // This test ensures that the $isOpen prop doesn't cause React warnings
      // The actual visual behavior is tested through the mobile menu tests above
      const navMenu = container.querySelector('ul');
      expect(navMenu).toBeInTheDocument();
      // The $isOpen prop should not appear as a DOM attribute
      expect(navMenu).not.toHaveAttribute('isOpen');
      expect(navMenu).not.toHaveAttribute('$isOpen');
    });

    it('does not pass href attribute to button elements', () => {
      const navItems = [{ label: 'Button Item', onClick: jest.fn() }];
      render(<Navbar navItems={navItems} />);
      const buttonElement = screen.getByText('Button Item');
      expect(buttonElement.tagName).toBe('BUTTON');
      expect(buttonElement).not.toHaveAttribute('href');
    });

    it('passes href attribute only to anchor elements', () => {
      const navItems = [{ label: 'Link Item', href: '/test' }];
      render(<Navbar navItems={navItems} />);
      const linkElement = screen.getByText('Link Item');
      expect(linkElement.tagName).toBe('A');
      expect(linkElement).toHaveAttribute('href', '/test');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty navigation items array', () => {
      render(<Navbar navItems={[]} />);
      // Should render without errors, just the brand
      expect(screen.getByText('Coalition Builder')).toBeInTheDocument();
    });

    it('handles navigation items without onClick or href', () => {
      const navItems = [{ label: 'Static Item' }];
      render(<Navbar navItems={navItems} />);
      const item = screen.getByText('Static Item');
      expect(item).toBeInTheDocument();
      // Should render as button by default
      expect(item.tagName).toBe('BUTTON');
    });

    it('handles undefined props gracefully', () => {
      render(<Navbar currentView={undefined} onNavigate={undefined} />);
      expect(screen.getByText('Coalition Builder')).toBeInTheDocument();
      expect(screen.getByText('All Campaigns')).toBeInTheDocument();
    });
  });
});
