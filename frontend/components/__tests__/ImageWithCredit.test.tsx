import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ImageWithCredit from "../ImageWithCredit";

describe("ImageWithCredit", () => {
  const defaultProps = {
    src: "https://example.com/image.jpg",
    alt: "Test image",
  };

  describe("Basic rendering", () => {
    it("renders image with src and alt", () => {
      render(<ImageWithCredit {...defaultProps} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", defaultProps.src);
      expect(img).toHaveAttribute("alt", defaultProps.alt);
    });

    it("applies custom className to container", () => {
      const { container } = render(
        <ImageWithCredit {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies custom imgClassName to image", () => {
      render(
        <ImageWithCredit {...defaultProps} imgClassName="custom-img-class" />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveClass("custom-img-class");
    });
  });

  describe("Credit text building", () => {
    it("shows no credit when no credit fields provided", () => {
      const { container } = render(<ImageWithCredit {...defaultProps} />);

      // Should not have any credit text
      expect(container.textContent).toBe("");
    });

    it("builds credit with title only", () => {
      render(<ImageWithCredit {...defaultProps} title="Beautiful Sunset" />);

      expect(screen.getByText('"Beautiful Sunset"')).toBeInTheDocument();
    });

    it("builds credit with author only", () => {
      render(<ImageWithCredit {...defaultProps} author="John Doe" />);

      expect(screen.getByText("by John Doe")).toBeInTheDocument();
    });

    it("builds credit with license only", () => {
      render(<ImageWithCredit {...defaultProps} license="CC BY 4.0" />);

      expect(
        screen.getByText("is licensed under CC BY 4.0"),
      ).toBeInTheDocument();
    });

    it("builds credit with all fields", () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="Beautiful Sunset"
          author="John Doe"
          license="CC BY 4.0"
        />,
      );

      expect(
        screen.getByText(
          '"Beautiful Sunset" by John Doe is licensed under CC BY 4.0',
        ),
      ).toBeInTheDocument();
    });

    it("trims whitespace from credit fields", () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title="  Beautiful Sunset  "
          author="  John Doe  "
          license="  CC BY 4.0  "
        />,
      );

      expect(
        screen.getByText(
          '"Beautiful Sunset" by John Doe is licensed under CC BY 4.0',
        ),
      ).toBeInTheDocument();
    });

    it("ignores empty string fields", () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title=""
          author="John Doe"
          license=""
        />,
      );

      expect(screen.getByText("by John Doe")).toBeInTheDocument();
      expect(screen.queryByText('""')).not.toBeInTheDocument();
    });
  });

  describe("Credit display modes", () => {
    const propsWithCredit = {
      ...defaultProps,
      author: "John Doe",
      license: "CC BY 4.0",
    };

    describe("caption mode (default)", () => {
      it("displays credit as caption below image", () => {
        const { container } = render(<ImageWithCredit {...propsWithCredit} />);

        const creditDiv = container.querySelector(".mt-1.text-right");
        expect(creditDiv).toBeInTheDocument();
        expect(creditDiv).toHaveTextContent(
          "by John Doe is licensed under CC BY 4.0",
        );
      });

      it("displays credit as link when sourceUrl provided", () => {
        render(
          <ImageWithCredit
            {...propsWithCredit}
            sourceUrl="https://example.com/source"
          />,
        );

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "https://example.com/source");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link).toHaveClass("hover:text-gray-800", "underline");
      });
    });

    describe("overlay mode", () => {
      it("displays credit as overlay on image", () => {
        const { container } = render(
          <ImageWithCredit {...propsWithCredit} creditDisplay="overlay" />,
        );

        expect(container.firstChild).toHaveClass("relative", "inline-block");

        const overlay = container.querySelector(".absolute.bottom-2.right-2");
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass("bg-black", "bg-opacity-60", "text-white");
        expect(overlay).toHaveTextContent(
          "by John Doe is licensed under CC BY 4.0",
        );
      });

      it("displays overlay credit as link when sourceUrl provided", () => {
        render(
          <ImageWithCredit
            {...propsWithCredit}
            creditDisplay="overlay"
            sourceUrl="https://example.com/source"
          />,
        );

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "https://example.com/source");
        expect(link).toHaveClass("hover:text-gray-200", "underline");
      });
    });

    describe("tooltip mode", () => {
      it("displays credit as tooltip on hover", () => {
        const { container } = render(
          <ImageWithCredit {...propsWithCredit} creditDisplay="tooltip" />,
        );

        expect(container.firstChild).toHaveClass("relative", "inline-block");

        const tooltipContainer = container.querySelector(".group");
        expect(tooltipContainer).toBeInTheDocument();

        const tooltip = container.querySelector(".absolute.top-2.right-2");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveClass("opacity-0", "group-hover:opacity-100");

        const tooltipContent = tooltip?.querySelector(".bg-gray-800");
        expect(tooltipContent).toHaveClass(
          "text-white",
          "px-2",
          "py-1",
          "rounded",
        );
        expect(tooltipContent).toHaveTextContent(
          "by John Doe is licensed under CC BY 4.0",
        );
      });
    });

    describe("none mode", () => {
      it("hides credit when creditDisplay is none", () => {
        const { container } = render(
          <ImageWithCredit {...propsWithCredit} creditDisplay="none" />,
        );

        expect(container.textContent).toBe("");
        expect(screen.queryByText("by John Doe")).not.toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("handles undefined values gracefully", () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title={undefined}
          author={undefined}
          license={undefined}
          sourceUrl={undefined}
        />,
      );

      // Should render without errors
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("handles very long credit text", () => {
      const longText = "A".repeat(100);
      render(
        <ImageWithCredit
          {...defaultProps}
          title={longText}
          author={longText}
          license={longText}
        />,
      );

      // Should render without breaking
      expect(screen.getByText(new RegExp(longText))).toBeInTheDocument();
    });

    it("handles special characters in credit fields", () => {
      render(
        <ImageWithCredit
          {...defaultProps}
          title='Test & "Quote"'
          author="O'Neill"
          license="CC BY-SA 4.0 <International>"
        />,
      );

      expect(screen.getByText(/Test & "Quote"/)).toBeInTheDocument();
      expect(screen.getByText(/O'Neill/)).toBeInTheDocument();
      expect(
        screen.getByText(/CC BY-SA 4.0 <International>/),
      ).toBeInTheDocument();
    });
  });
});
