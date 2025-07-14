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

  it("renders with custom organization name", () => {
    render(<SSRFooter organizationName="Test Organization" />);

    const copyright = screen.getByText(
      /© \d{4} Test Organization\. All rights reserved\./,
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders with custom year", () => {
    render(<SSRFooter year={2025} />);

    const copyright = screen.getByText(
      /© 2025 Coalition Builder\. All rights reserved\./,
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders with both custom organization name and year", () => {
    render(<SSRFooter organizationName="Custom Org" year={2030} />);

    const copyright = screen.getByText(
      "© 2030 Custom Org. All rights reserved.",
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
