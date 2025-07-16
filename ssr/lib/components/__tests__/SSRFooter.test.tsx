import React from "react";
import { render, screen } from "@testing-library/react";
import SSRFooter from "../SSRFooter";

describe("SSRFooter", () => {
  it("renders with default props", () => {
    render(<SSRFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    const copyright = screen.getByText(
      /© \d{4} Coalition Builder\. All rights reserved\./,
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders with custom organization info", () => {
    const orgInfo = {
      id: 1,
      organization_name: "Test Organization",
      tagline: "Test tagline",
      hero_title: "Test title",
      cta_title: "Join us",
      cta_button_text: "Get started",
      campaigns_section_title: "Campaigns",
      show_campaigns_section: true,
      is_active: true,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    render(<SSRFooter orgInfo={orgInfo} />);

    const copyright = screen.getByText(
      /© \d{4} Test Organization\. All rights reserved\./,
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders current year by default", () => {
    render(<SSRFooter />);

    const currentYear = new Date().getFullYear();
    const copyright = screen.getByText(
      new RegExp(
        `© ${currentYear} Coalition Builder\\. All rights reserved\\.`,
      ),
    );
    expect(copyright).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<SSRFooter />);

    const footer = container.querySelector("footer");
    expect(footer).toHaveClass("footer");

    const containerDiv = container.querySelector("div.container");
    expect(containerDiv).toBeInTheDocument();

    const contentDiv = container.querySelector("div.content");
    expect(contentDiv).toBeInTheDocument();

    const copyright = container.querySelector("p.copyright");
    expect(copyright).toBeInTheDocument();
  });

  it("renders legal links with correct navigation", () => {
    render(<SSRFooter />);

    // Check for navigation with aria-label
    const navigation = screen.getByRole("navigation", { name: "Legal links" });
    expect(navigation).toBeInTheDocument();

    // Check for Terms of Use link
    const termsLink = screen.getByRole("link", { name: "Terms of Use" });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute("href", "/terms");

    // Check for Privacy Policy link
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("applies correct CSS classes to legal links", () => {
    const { container } = render(<SSRFooter />);

    const legalLinksNav = container.querySelector("nav.legalLinks");
    expect(legalLinksNav).toBeInTheDocument();

    const legalLinks = container.querySelectorAll("a.legalLink");
    expect(legalLinks).toHaveLength(2);
  });
});
