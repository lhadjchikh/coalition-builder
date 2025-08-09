import React from "react";
import { render } from "@testing-library/react";
import ThemeStyles from "../ThemeStyles";

describe("ThemeStyles", () => {
  it("should render style tag with CSS variables when provided", () => {
    const cssVariables = ":root { --theme-primary: #ff0000; }";
    const { container } = render(<ThemeStyles cssVariables={cssVariables} />);

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(cssVariables);
  });

  it("should render style tag with custom CSS when provided", () => {
    const customCss = ".custom { color: red; }";
    const { container } = render(<ThemeStyles customCss={customCss} />);

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(customCss);
  });

  it("should render both CSS variables and custom CSS when both provided", () => {
    const cssVariables = ":root { --theme-primary: #ff0000; }";
    const customCss = ".custom { color: red; }";
    const { container } = render(
      <ThemeStyles cssVariables={cssVariables} customCss={customCss} />,
    );

    const styleTags = container.querySelectorAll("style");
    expect(styleTags).toHaveLength(2);
    expect(styleTags[0]?.innerHTML).toContain(cssVariables);
    expect(styleTags[1]?.innerHTML).toContain(customCss);
  });

  it("should render nothing when no props are provided", () => {
    const { container } = render(<ThemeStyles />);

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeInTheDocument();
  });

  it("should render nothing when cssVariables and customCss are empty", () => {
    const { container } = render(<ThemeStyles cssVariables="" customCss="" />);

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeInTheDocument();
  });

  it("should handle undefined cssVariables gracefully", () => {
    const customCss = ".custom { color: red; }";
    const { container } = render(<ThemeStyles customCss={customCss} />);

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(customCss);
  });

  it("should handle undefined customCss gracefully", () => {
    const cssVariables = ":root { --theme-primary: #ff0000; }";
    const { container } = render(<ThemeStyles cssVariables={cssVariables} />);

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain(cssVariables);
  });
});
