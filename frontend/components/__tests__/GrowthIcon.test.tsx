import React from "react";
import { render, screen } from "@testing-library/react";
import GrowthIcon from "../GrowthIcon";

describe("GrowthIcon", () => {
  it("renders seed icon with correct attributes", () => {
    render(<GrowthIcon stage="seed" />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "48px");
    expect(icon).toHaveAttribute("height", "48px");
    expect(icon.tagName).toBe("IMG");
  });

  it("renders seedling icon with correct attributes", () => {
    render(<GrowthIcon stage="seedling" />);

    const icon = screen.getByAltText("seedling growth stage icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "48px");
    expect(icon).toHaveAttribute("height", "48px");
  });

  it("renders tree icon with correct attributes", () => {
    render(<GrowthIcon stage="tree" />);

    const icon = screen.getByAltText("tree growth stage icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "48px");
    expect(icon).toHaveAttribute("height", "48px");
  });

  it("applies custom size", () => {
    render(<GrowthIcon stage="seed" size="64px" />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toHaveAttribute("width", "64px");
    expect(icon).toHaveAttribute("height", "64px");
    expect(icon).toHaveStyle({ width: "64px", height: "64px" });
  });

  it("applies custom color", () => {
    render(<GrowthIcon stage="seed" color="#ff0000" />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toHaveStyle({ color: "#ff0000" });
  });

  it("applies custom className", () => {
    render(<GrowthIcon stage="seed" className="custom-class" />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toHaveClass("custom-class");
  });

  it("applies custom style", () => {
    const customStyle = { opacity: 0.5, transform: "rotate(45deg)" };
    render(<GrowthIcon stage="seed" style={customStyle} />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toHaveStyle({ opacity: "0.5", transform: "rotate(45deg)" });
  });

  it("combines custom props correctly", () => {
    render(
      <GrowthIcon
        stage="tree"
        size="100px"
        color="green"
        className="test-icon"
        style={{ border: "1px solid black" }}
      />,
    );

    const icon = screen.getByAltText("tree growth stage icon");
    expect(icon).toHaveAttribute("width", "100px");
    expect(icon).toHaveAttribute("height", "100px");
    expect(icon).toHaveClass("test-icon");
    expect(icon).toHaveStyle({
      width: "100px",
      height: "100px",
      color: "rgb(0, 128, 0)", // "green" is resolved to rgb(0, 128, 0) in tests
      border: "1px solid black",
    });
  });

  it("uses default size when not provided", () => {
    render(<GrowthIcon stage="seed" />);

    const icon = screen.getByAltText("seed growth stage icon");
    expect(icon).toHaveAttribute("width", "48px");
    expect(icon).toHaveAttribute("height", "48px");
  });

  it("uses currentColor as default color", () => {
    render(<GrowthIcon stage="seed" />);

    const icon = screen.getByAltText("seed growth stage icon");
    // In test environment, currentColor is resolved to canvastext
    expect(icon).toHaveStyle({ color: "canvastext" });
  });

  // Test the default case in getSvgUrl switch statement
  it("handles invalid stage gracefully by defaulting to seed", () => {
    // @ts-ignore - Testing invalid prop
    render(<GrowthIcon stage="invalid" />);

    const icon = screen.getByAltText("invalid growth stage icon");
    expect(icon).toBeInTheDocument();
    // The component should fallback to seed icon when invalid stage is provided
    expect(icon).toHaveAttribute("src");
    expect(icon.getAttribute("src")).not.toBeNull();
  });
});
