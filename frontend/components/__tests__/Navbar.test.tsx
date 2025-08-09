import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../Navbar";
import { DEFAULT_NAV_ITEMS } from "../../types/index";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

describe("Navbar", () => {
  beforeEach(() => {
    // Reset pathname mock to homepage
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/");
  });

  describe("Basic Rendering", () => {
    it("renders with default organization name", () => {
      render(<Navbar />);
      expect(screen.getByText("Coalition Builder")).toBeInTheDocument();
    });

    it("renders with custom organization name", () => {
      render(<Navbar organizationName="Test Organization" />);
      expect(screen.getByText("Test Organization")).toBeInTheDocument();
    });

    it("renders default navigation items when provided", () => {
      render(<Navbar navItems={DEFAULT_NAV_ITEMS} />);
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Campaigns")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<Navbar className="custom-navbar-class" />);
      expect(screen.getByRole("navigation")).toHaveClass("custom-navbar-class");
    });

    it("renders empty navigation when no items provided", () => {
      render(<Navbar />);
      // Should not render any navigation items
      expect(screen.queryByText("About")).not.toBeInTheDocument();
      expect(screen.queryByText("Campaigns")).not.toBeInTheDocument();
    });
  });

  describe("Custom Navigation Items", () => {
    const customNavItems = [
      { label: "Campaigns", href: "/campaigns" },
      { label: "About", href: "/about" },
      { label: "Contact", onClick: jest.fn() },
    ];

    it("renders custom navigation items", () => {
      render(<Navbar navItems={customNavItems} />);
      expect(screen.getByText("Campaigns")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
    });

    it("applies active class to active navigation items", () => {
      const { usePathname } = require("next/navigation");
      usePathname.mockReturnValue("/about");

      render(<Navbar navItems={customNavItems} />);
      const aboutLink = screen.getByText("About");
      expect(aboutLink).toHaveClass("bg-white/20");
    });

    it("applies active class to Campaigns link when on campaigns page", () => {
      const { usePathname } = require("next/navigation");
      usePathname.mockReturnValue("/campaigns");

      render(<Navbar navItems={customNavItems} />);
      const campaignsLink = screen.getByText("Campaigns");
      expect(campaignsLink).toHaveClass("bg-white/20");
    });

    it("renders links as anchor tags when href is provided", () => {
      render(<Navbar navItems={customNavItems} />);
      const campaignsLink = screen.getByText("Campaigns");
      expect(campaignsLink.tagName).toBe("A");
      expect(campaignsLink).toHaveAttribute("href", "/campaigns");
    });

    it("renders links as buttons when onClick is provided", () => {
      render(<Navbar navItems={customNavItems} />);
      const contactLink = screen.getByText("Contact");
      expect(contactLink.tagName).toBe("BUTTON");
    });

    it("calls onClick handler when custom nav item is clicked", () => {
      const onClickMock = jest.fn();
      const navItemsWithClick = [{ label: "Contact", onClick: onClickMock }];

      render(<Navbar navItems={navItemsWithClick} />);
      fireEvent.click(screen.getByText("Contact"));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Navigation Links", () => {
    it("renders brand as clickable link", () => {
      render(<Navbar />);
      const brandLink = screen.getByText("Coalition Builder");
      expect(brandLink.tagName).toBe("A");
      expect(brandLink).toHaveAttribute("href", "/");
    });
  });

  describe("Mobile Menu", () => {
    it("renders mobile menu toggle button with accessibility label", () => {
      render(<Navbar />);
      const toggleButton = screen.getByLabelText("Toggle navigation menu");
      expect(toggleButton).toBeInTheDocument();
    });

    it("toggles mobile menu when button is clicked", () => {
      const navItems = [
        { label: "About", href: "/about" },
        { label: "Campaigns", href: "/campaigns" },
      ];

      render(<Navbar navItems={navItems} />);
      const toggleButton = screen.getByLabelText("Toggle navigation menu");

      // Mobile menu should be closed initially
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");

      // Click to open menu
      fireEvent.click(toggleButton);

      // Mobile menu should be open now (multiple instances of nav items)
      const mobileMenuItems = screen.getAllByText("About");
      expect(mobileMenuItems.length).toBe(2); // One for desktop, one for mobile
    });

    it("closes mobile menu when navigation item is clicked", async () => {
      const navItems = [{ label: "About", href: "/about" }];

      render(<Navbar navItems={navItems} />);
      const toggleButton = screen.getByLabelText("Toggle navigation menu");

      // Open menu
      fireEvent.click(toggleButton);

      // Click navigation item (mobile version)
      const mobileNavItems = screen.getAllByText("About");
      fireEvent.click(mobileNavItems[1]); // Click the mobile version

      // Menu should be closed (items should not be visible in mobile view)
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("closes mobile menu when custom nav item with onClick is clicked", async () => {
      const onClickMock = jest.fn();
      const navItems = [{ label: "Contact", onClick: onClickMock }];

      render(<Navbar navItems={navItems} />);
      const toggleButton = screen.getByLabelText("Toggle navigation menu");

      // Open menu
      fireEvent.click(toggleButton);

      // Click custom nav item (mobile version)
      const mobileNavItems = screen.getAllByText("Contact");
      fireEvent.click(mobileNavItems[1]); // Click the mobile version

      // Menu should be closed
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-expanded", "false");
      });
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it("closes mobile menu when brand is clicked", () => {
      render(<Navbar />);
      const toggleButton = screen.getByLabelText("Toggle navigation menu");

      // Open menu
      fireEvent.click(toggleButton);

      // Click brand
      const brandLinks = screen.getAllByText("Coalition Builder");
      fireEvent.click(brandLinks[0]);

      // Menu should be closed
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Styled Components Props", () => {
    it("renders navigation menu correctly", () => {
      const navItems = [{ label: "About", href: "/about" }];

      const { container } = render(<Navbar navItems={navItems} />);

      // Check that the navigation menu is rendered
      const navMenu = container.querySelector("nav");
      expect(navMenu).toBeInTheDocument();

      // Check that navigation items are rendered
      expect(screen.getByText("About")).toBeInTheDocument();
    });

    it("does not pass href attribute to button elements", () => {
      const navItems = [{ label: "Contact", onClick: jest.fn() }];

      render(<Navbar navItems={navItems} />);
      const contactButton = screen.getByText("Contact");
      expect(contactButton).not.toHaveAttribute("href");
    });

    it("passes href attribute only to anchor elements", () => {
      const navItems = [{ label: "About", href: "/about" }];

      render(<Navbar navItems={navItems} />);
      const aboutLink = screen.getByText("About");
      expect(aboutLink).toHaveAttribute("href", "/about");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty navigation items array", () => {
      render(<Navbar navItems={[]} />);
      expect(screen.getByText("Coalition Builder")).toBeInTheDocument();
      // Should not render any navigation items
      expect(screen.queryByText("About")).not.toBeInTheDocument();
    });

    it("handles navigation items without onClick or href", () => {
      const navItems = [{ label: "Static Item" }];

      render(<Navbar navItems={navItems} />);
      expect(screen.getByText("Static Item")).toBeInTheDocument();
    });

    it("handles undefined props gracefully", () => {
      render(<Navbar currentView={undefined} onNavigate={undefined} />);
      expect(screen.getByText("Coalition Builder")).toBeInTheDocument();
    });
  });
});
