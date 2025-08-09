import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../Navbar";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

describe("Navbar scroll behavior", () => {
  beforeEach(() => {
    // Reset scroll position
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    // Reset the mock
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/");
    // Mock requestAnimationFrame for tests
    global.requestAnimationFrame = (callback) => {
      callback(0);
      return 0;
    };
  });

  test("navbar is transparent at top of page on homepage", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    expect(nav).toHaveClass("bg-transparent");
    expect(nav).toHaveClass("border-transparent");
    expect(nav).not.toHaveClass("navbar-glass");
    expect(nav).not.toHaveClass("border-white/10");
  });

  test("navbar becomes glass effect when scrolled on homepage", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    expect(nav).toHaveClass("navbar-glass");
    expect(nav).toHaveClass("border-white/10");
    expect(nav).not.toHaveClass("bg-transparent");
    expect(nav).not.toHaveClass("border-transparent");
  });

  test("navbar transitions back to transparent when scrolled to top on homepage", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // First scroll down
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(nav).toHaveClass("navbar-glass");

    // Then scroll back to top
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(nav).toHaveClass("bg-transparent");
    expect(nav).toHaveClass("border-transparent");
    expect(nav).not.toHaveClass("navbar-glass");
    expect(nav).not.toHaveClass("border-white/10");
  });

  test("navbar adds drop-shadow to text when transparent on homepage", () => {
    const navItems = [
      { label: "About", href: "/about" },
      { label: "Campaigns", href: "/campaigns" },
    ];

    render(<Navbar navItems={navItems} />);

    // Check desktop nav links have drop-shadow when transparent
    const links = screen.getAllByRole("link");
    links.forEach((link: HTMLElement) => {
      if (
        link.textContent &&
        ["About", "Campaigns"].includes(link.textContent)
      ) {
        expect(link).toHaveClass("drop-shadow-lg");
      }
    });

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    // Check drop-shadow is removed when scrolled
    const scrolledLinks = screen.getAllByRole("link");
    scrolledLinks.forEach((link: HTMLElement) => {
      if (
        link.textContent &&
        ["About", "Campaigns"].includes(link.textContent)
      ) {
        expect(link).not.toHaveClass("drop-shadow-lg");
      }
    });
  });

  test("navbar is always glass effect on non-homepage routes", () => {
    // Mock non-homepage location
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/about");

    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // Should have glass effect even at top of page
    expect(nav).toHaveClass("navbar-glass");
    expect(nav).toHaveClass("border-white/10");
    expect(nav).not.toHaveClass("bg-transparent");
    expect(nav).not.toHaveClass("border-transparent");

    // Should be sticky instead of fixed
    expect(nav).toHaveClass("sticky");
    expect(nav).not.toHaveClass("fixed");
  });

  test("navbar hides when scrolling down past 80px", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // Initially visible
    expect(nav).toHaveClass("translate-y-0");

    // Scroll down past 80px
    window.scrollY = 100;
    fireEvent.scroll(window);

    expect(nav).toHaveClass("-translate-y-full");
    expect(nav).not.toHaveClass("translate-y-0");
  });

  test("navbar shows when scrolling up", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // First scroll down past 80px
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(nav).toHaveClass("-translate-y-full");

    // Then scroll up a bit
    window.scrollY = 90;
    fireEvent.scroll(window);

    expect(nav).toHaveClass("translate-y-0");
    expect(nav).not.toHaveClass("-translate-y-full");
  });

  test("navbar always shows when at top of page", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // Scroll down to hide navbar
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(nav).toHaveClass("-translate-y-full");

    // Scroll back to top
    window.scrollY = 0;
    fireEvent.scroll(window);

    expect(nav).toHaveClass("translate-y-0");
    expect(nav).not.toHaveClass("-translate-y-full");
  });

  test("mobile menu closes when navbar hides", () => {
    const navItems = [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];

    render(<Navbar navItems={navItems} />);
    const toggleButton = screen.getByLabelText("Toggle navigation menu");

    // Open mobile menu
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    // Scroll down to hide navbar
    window.scrollY = 100;
    fireEvent.scroll(window);

    // Mobile menu should be closed
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });
});
