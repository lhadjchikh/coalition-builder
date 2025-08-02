import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '@shared/components/Navbar';

// Mock useLocation hook to simulate homepage
const mockUseLocation = jest.fn(() => ({ pathname: '/' }));

describe('Navbar scroll behavior', () => {
  beforeEach(() => {
    // Reset scroll position
    window.scrollY = 0;
  });

  test('navbar is transparent at top of page on homepage', () => {
    const { container } = render(<Navbar useLocation={mockUseLocation} />);
    const nav = container.querySelector('nav');

    expect(nav).toHaveClass('bg-transparent');
    expect(nav).toHaveClass('border-transparent');
    expect(nav).not.toHaveClass('navbar-glass');
    expect(nav).not.toHaveClass('border-white/10');
  });

  test('navbar becomes glass effect when scrolled on homepage', () => {
    const { container } = render(<Navbar useLocation={mockUseLocation} />);
    const nav = container.querySelector('nav');

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    expect(nav).toHaveClass('navbar-glass');
    expect(nav).toHaveClass('border-white/10');
    expect(nav).not.toHaveClass('bg-transparent');
    expect(nav).not.toHaveClass('border-transparent');
  });

  test('navbar transitions back to transparent when scrolled to top on homepage', () => {
    const { container } = render(<Navbar useLocation={mockUseLocation} />);
    const nav = container.querySelector('nav');

    // First scroll down
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(nav).toHaveClass('navbar-glass');

    // Then scroll back to top
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(nav).toHaveClass('bg-transparent');
    expect(nav).toHaveClass('border-transparent');
    expect(nav).not.toHaveClass('navbar-glass');
    expect(nav).not.toHaveClass('border-white/10');
  });

  test('navbar adds drop-shadow to text when transparent on homepage', () => {
    const navItems = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
    ];

    render(<Navbar navItems={navItems} useLocation={mockUseLocation} />);

    // Check desktop nav links have drop-shadow when transparent
    const links = screen.getAllByRole('link');
    links.forEach((link: HTMLElement) => {
      if (link.textContent && ['Home', 'About'].includes(link.textContent)) {
        expect(link).toHaveClass('drop-shadow-lg');
      }
    });

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    // Check drop-shadow is removed when scrolled
    const scrolledLinks = screen.getAllByRole('link');
    scrolledLinks.forEach((link: HTMLElement) => {
      if (link.textContent && ['Home', 'About'].includes(link.textContent)) {
        expect(link).not.toHaveClass('drop-shadow-lg');
      }
    });
  });

  test('navbar is always glass effect on non-homepage routes', () => {
    // Mock non-homepage location
    const nonHomepageLocation = jest.fn(() => ({ pathname: '/about' }));

    const { container } = render(<Navbar useLocation={nonHomepageLocation} />);
    const nav = container.querySelector('nav');

    // Should have glass effect even at top of page
    expect(nav).toHaveClass('navbar-glass');
    expect(nav).toHaveClass('border-white/10');
    expect(nav).not.toHaveClass('bg-transparent');
    expect(nav).not.toHaveClass('border-transparent');

    // Should be sticky instead of fixed
    expect(nav).toHaveClass('sticky');
    expect(nav).not.toHaveClass('fixed');
  });
});
