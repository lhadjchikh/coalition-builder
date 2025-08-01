import React from "react";
import GoogleFontsLoader from "../GoogleFontsLoader";

describe("GoogleFontsLoader", () => {
  it("returns null when no fonts provided", () => {
    const result = GoogleFontsLoader({});
    expect(result).toBeNull();
  });

  it("returns null when empty array provided", () => {
    const result = GoogleFontsLoader({ googleFonts: [] });
    expect(result).toBeNull();
  });

  it("returns Google Fonts links for single font", () => {
    const result = GoogleFontsLoader({ googleFonts: ["Roboto"] });
    expect(result).not.toBeNull();

    // Check the React element structure
    const children = React.Children.toArray(result.props.children);
    expect(children).toHaveLength(3);

    // Check preconnect links
    expect(children[0]).toMatchObject({
      type: "link",
      props: {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    });

    expect(children[1]).toMatchObject({
      type: "link",
      props: {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    });

    // Check stylesheet link
    expect(children[2]).toMatchObject({
      type: "link",
      props: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap",
      },
    });
  });

  it("returns Google Fonts links for multiple fonts", () => {
    const result = GoogleFontsLoader({
      googleFonts: ["Open Sans", "Lato", "Montserrat"],
    });
    expect(result).not.toBeNull();

    const children = React.Children.toArray(result.props.children);
    expect(children[2]).toMatchObject({
      type: "link",
      props: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Lato:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap",
      },
    });
  });

  it("handles fonts with spaces correctly", () => {
    const result = GoogleFontsLoader({
      googleFonts: ["Open Sans", "Roboto Slab"],
    });
    expect(result).not.toBeNull();

    const children = React.Children.toArray(result.props.children);
    expect(children[2]).toMatchObject({
      type: "link",
      props: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Roboto+Slab:wght@400;500;600;700&display=swap",
      },
    });
  });

  it("filters out empty font names", () => {
    const result = GoogleFontsLoader({
      googleFonts: ["Roboto", "", "  ", "Lato"],
    });
    expect(result).not.toBeNull();

    const children = React.Children.toArray(result.props.children);
    expect(children[2]).toMatchObject({
      type: "link",
      props: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Lato:wght@400;500;600;700&display=swap",
      },
    });
  });

  it("returns null when all font names are empty", () => {
    const result = GoogleFontsLoader({ googleFonts: ["", "  ", "   "] });
    expect(result).toBeNull();
  });
});
