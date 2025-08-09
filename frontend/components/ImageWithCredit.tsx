import React from "react";
import Image from "next/image";

interface ImageWithCreditProps {
  src: string;
  alt: string;
  title?: string;
  author?: string;
  license?: string;
  sourceUrl?: string;
  caption?: string;
  captionDisplay?: "below" | "overlay" | "tooltip" | "none";
  creditDisplay?: "caption" | "overlay" | "tooltip" | "none";
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean; // Use fill mode for dynamic dimensions
}

// Helper function to determine display mode
const getDisplayMode = (
  captionDisplay: string | undefined,
  caption: string | undefined,
  creditDisplay: string,
): string => {
  // If captionDisplay is explicitly set, use it regardless of whether there's a caption
  if (captionDisplay !== undefined) {
    return captionDisplay;
  }
  // If there's a caption but no explicit display mode, default to "below"
  if (caption) {
    return "below";
  }
  // Otherwise use the creditDisplay setting
  return creditDisplay;
};

const ImageWithCredit: React.FC<ImageWithCreditProps> = ({
  src,
  alt,
  title,
  author,
  license,
  sourceUrl,
  caption,
  captionDisplay,
  creditDisplay = "caption",
  className = "",
  imgClassName = "",
  width,
  height,
  priority = false,
  fill = false,
}) => {
  // Use caption if provided, otherwise build credit text from individual fields
  const creditText =
    caption?.trim() ||
    (() => {
      const parts: string[] = [];

      if (title?.trim()) {
        parts.push(`"${title.trim()}"`);
      }

      if (author?.trim()) {
        parts.push(`by ${author.trim()}`);
      }

      if (license?.trim()) {
        parts.push(`is licensed under ${license.trim()}`);
      }

      return parts.join(" ");
    })();

  // Determine which display mode to use
  const displayMode = getDisplayMode(captionDisplay, caption, creditDisplay);
  const hasCredit = creditText.length > 0;

  // Render credit based on display mode
  const renderCredit = () => {
    if (!hasCredit || displayMode === "none") return null;

    // For custom caption, render as HTML
    const creditElement = caption ? (
      <span
        className="text-xs text-gray-600"
        dangerouslySetInnerHTML={{ __html: creditText }}
      />
    ) : (
      <span className="text-xs text-gray-600">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 underline"
          >
            {creditText}
          </a>
        ) : (
          creditText
        )}
      </span>
    );

    switch (displayMode) {
      case "caption":
      case "below":
        return <div className="mt-1 text-right">{creditElement}</div>;

      case "overlay":
        return (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            {caption ? (
              <span dangerouslySetInnerHTML={{ __html: creditText }} />
            ) : sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-200 underline"
              >
                {creditText}
              </a>
            ) : (
              creditText
            )}
          </div>
        );

      case "tooltip":
        return (
          <div className="group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {caption ? (
                  <span dangerouslySetInnerHTML={{ __html: creditText }} />
                ) : sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-200 underline"
                  >
                    {creditText}
                  </a>
                ) : (
                  creditText
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Container classes based on display mode
  const containerClasses = [
    displayMode === "overlay" || displayMode === "tooltip"
      ? "relative inline-block"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Determine if we should use fill mode or specific dimensions
  const imageElement = fill || (!width || !height) ? (
    <div className="relative w-full" style={{ minHeight: '200px' }}>
      <Image
        src={src}
        alt={alt}
        fill
        className={`${imgClassName} object-contain`}
        title={title}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={imgClassName}
      title={title}
      priority={priority}
    />
  );

  return (
    <div className={containerClasses} data-testid="image-with-credit">
      {imageElement}
      {renderCredit()}
    </div>
  );
};

export default ImageWithCredit;
