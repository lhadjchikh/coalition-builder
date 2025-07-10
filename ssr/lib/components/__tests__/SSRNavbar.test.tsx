import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SSRNavbar from "../SSRNavbar";
import type { NavItemData } from "@shared/types";

describe("SSRNavbar", () => {
  const mockNavItems: NavItemData[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Campaigns", href: "/campaigns" },
  ];

  const defaultProps = {
    organizationName: "Test Organization",
    navItems: mockNavItems,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render organization name", () => {
    render(<SSRNavbar {...defaultProps} />);

    expect(screen.getByText("Test Organization")).toBeInTheDocument();
  });

  it("should render all navigation items", () => {
    render(<SSRNavbar {...defaultProps} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
  });

  it("should render navigation items with correct href attributes", () => {
    render(<SSRNavbar {...defaultProps} />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    const aboutLink = screen.getByRole("link", { name: "About" });
    const campaignsLink = screen.getByRole("link", { name: "Campaigns" });

    expect(homeLink).toHaveAttribute("href", "/");
    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(campaignsLink).toHaveAttribute("href", "/campaigns");
  });

  it("should have correct CSS classes applied", () => {
    render(<SSRNavbar {...defaultProps} />);

    const navbar = screen.getByRole("navigation");
    const organizationName = screen.getByText("Test Organization");
    const navList = screen.getByRole("list");
    const homeLink = screen.getByRole("link", { name: "Home" });

    // Check that CSS modules classes are applied
    expect(navbar).toHaveClass(/navbar/);
    expect(organizationName).toHaveClass(/organizationName/);
    expect(navList).toHaveClass(/navList/);
    expect(homeLink).toHaveClass(/navLink/);
  });

  it("should render with empty navItems array", () => {
    render(<SSRNavbar organizationName="Test Org" navItems={[]} />);

    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("should handle missing organization name", () => {
    render(<SSRNavbar organizationName="" navItems={mockNavItems} />);

    // Component should still render navigation items
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
  });

  it("should have proper accessibility structure", () => {
    render(<SSRNavbar {...defaultProps} />);

    const nav = screen.getByRole("navigation");
    const list = screen.getByRole("list");
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(list).toBeInTheDocument();
    expect(links).toHaveLength(3); // 3 nav items (organization name is not a link)
  });
});
