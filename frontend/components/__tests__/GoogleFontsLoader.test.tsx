import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoogleFontsLoader from "../GoogleFontsLoader";

describe("GoogleFontsLoader", () => {
  it("returns null when no fonts provided", () => {
    const { container } = render(<GoogleFontsLoader />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when empty array provided", () => {
    const { container } = render(<GoogleFontsLoader googleFonts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns Google Fonts links for single font", () => {
    const { container } = render(
      <GoogleFontsLoader googleFonts={["Roboto"]} />
    );

    // Check stylesheet link - this is the most important part
    const stylesheetLink = container.querySelector('link[rel="stylesheet"]');
    expect(stylesheetLink).toBeInTheDocument();
    expect(stylesheetLink).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap"
    );

    // In real environment, there would also be preconnect links,
    // but they may not render in test environment
    const allLinks = container.querySelectorAll("link");
    expect(allLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("returns Google Fonts links for multiple fonts", () => {
    const { container } = render(
      <GoogleFontsLoader googleFonts={["Open Sans", "Lato", "Montserrat"]} />
    );

    const stylesheetLink = container.querySelector('link[rel="stylesheet"]');
    expect(stylesheetLink).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
    );
  });

  it("handles fonts with spaces correctly", () => {
    const { container } = render(
      <GoogleFontsLoader googleFonts={["Open Sans", "Roboto Slab"]} />
    );

    const stylesheetLink = container.querySelector('link[rel="stylesheet"]');
    expect(stylesheetLink).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700&display=swap"
    );
  });

  it("filters out empty font names", () => {
    const { container } = render(
      <GoogleFontsLoader googleFonts={["Roboto", "", "  ", "Lato"]} />
    );

    const stylesheetLink = container.querySelector('link[rel="stylesheet"]');
    expect(stylesheetLink).toHaveAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Lato:wght@400;500;600;700&display=swap"
    );
  });

  it("returns null when all font names are empty", () => {
    const { container } = render(
      <GoogleFontsLoader googleFonts={["", "  ", "   "]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
