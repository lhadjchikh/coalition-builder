import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../Navbar";

describe("Navbar scroll behavior", () => {
  beforeEach(() => {
    // Reset scroll position
    window.scrollY = 0;
  });

  test("navbar is transparent at top of page", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    expect(nav).toHaveClass("bg-transparent");
    expect(nav).not.toHaveClass("navbar-glass");
  });

  test("navbar becomes glass effect when scrolled", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav");

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    expect(nav).toHaveClass("navbar-glass");
    expect(nav).not.toHaveClass("bg-transparent");
  });

  test("navbar transitions back to transparent when scrolled to top", () => {
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
    expect(nav).not.toHaveClass("navbar-glass");
  });

  test("navbar adds drop-shadow to text when transparent", () => {
    const navItems = [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ];

    render(<Navbar navItems={navItems} />);

    // Check desktop nav links have drop-shadow when transparent
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      if (link.textContent && ["Home", "About"].includes(link.textContent)) {
        expect(link).toHaveClass("drop-shadow-lg");
      }
    });

    // Simulate scroll
    window.scrollY = 50;
    fireEvent.scroll(window);

    // Check drop-shadow is removed when scrolled
    const scrolledLinks = screen.getAllByRole("link");
    scrolledLinks.forEach((link) => {
      if (link.textContent && ["Home", "About"].includes(link.textContent)) {
        expect(link).not.toHaveClass("drop-shadow-lg");
      }
    });
  });
});
