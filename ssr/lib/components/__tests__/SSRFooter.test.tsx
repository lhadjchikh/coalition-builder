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
});
