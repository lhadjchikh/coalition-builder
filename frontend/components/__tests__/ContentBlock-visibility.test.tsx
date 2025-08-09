import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ContentBlock from "../ContentBlock";
import { baseContentBlock } from "./ContentBlock-test-helpers";

describe("ContentBlock - Visibility Control", () => {
  it("should render when is_visible is true", () => {
    const block = { ...baseContentBlock, is_visible: true };
    render(<ContentBlock block={block} />);

    expect(screen.getByText("Test Block")).toBeInTheDocument();
  });

  it("should not render when is_visible is false", () => {
    const block = { ...baseContentBlock, is_visible: false };
    const { container } = render(<ContentBlock block={block} />);

    expect(container.firstChild).toBeNull();
  });
});
