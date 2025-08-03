"use client";

import React, { useEffect, useRef, useState } from "react";

// Generic content block interface that works with both frontend and SSR
interface ContentBlockData {
  id: string | number;
  title?: string;
  content: string;
  block_type: string;
  image_url?: string;
  image_alt_text?: string;
  layout_option?: string;
  vertical_alignment?: string;
  css_classes?: string;
  background_color?: string;
  is_visible?: boolean;
  order?: number;
}

interface ContentBlockProps {
  block: ContentBlockData;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ block }) => {
  const [isVisible, setIsVisible] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip animation in SSR or if IntersectionObserver is not available
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "50px", // Start animation slightly before element comes into view
      },
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => {
      if (blockRef.current) {
        observer.unobserve(blockRef.current);
      }
    };
  }, []);
  if (block.is_visible === false) {
    return null;
  }

  const getBlockClasses = () => {
    const baseClasses = "w-full content-block-animate";
    const animationClass = isVisible ? "content-block-visible" : "";
    const customClasses = block.css_classes ? ` ${block.css_classes}` : "";
    return `${baseClasses} ${animationClass}${customClasses}`;
  };

  const getBlockStyle = () => {
    const style: React.CSSProperties = {};
    if (block.background_color) {
      style.backgroundColor = block.background_color;
    }
    return style;
  };

  const renderContent = () => {
    switch (block.block_type) {
      case "text":
        return (
          <div>
            {block.title && (
              <h3 className="h3 text-theme-heading">{block.title}</h3>
            )}
            <div
              className="text-body-lg text-theme-text-body content-prose"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );

      case "image":
        return (
          <div className="text-center">
            {block.title && (
              <h3 className="h3 text-theme-heading mb-8">{block.title}</h3>
            )}
            {block.image_url && (
              <figure className="relative inline-block">
                <img
                  src={block.image_url}
                  alt={block.image_alt_text || block.title || "Content image"}
                  className="rounded-2xl shadow-soft max-w-full h-auto mx-auto"
                />
              </figure>
            )}
            {block.content && (
              <div
                className="mt-6 text-body text-theme-text-muted max-w-reading-lg mx-auto content-prose"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
          </div>
        );

      case "text_image":
        // Determine grid layout based on layout_option
        const isReversed = block.layout_option === "reversed";
        const isStacked =
          block.layout_option === "stacked" ||
          block.layout_option === "stacked_reversed";
        const isStackedReversed = block.layout_option === "stacked_reversed";

        // Helper function to get vertical alignment class
        const getAlignmentClass = () => {
          switch (block.vertical_alignment) {
            case "top":
              return "items-start";
            case "bottom":
              return "items-end";
            case "middle":
            default:
              return "items-center";
          }
        };

        // Helper function to get grid layout class
        const getGridClass = () => {
          const baseClasses = "grid gap-8 lg:gap-12";
          const alignmentClass = getAlignmentClass();
          const columnsClass = isStacked
            ? "grid-cols-1"
            : "grid-cols-1 lg:grid-cols-2";
          return `${baseClasses} ${alignmentClass} ${columnsClass}`;
        };

        // Helper function to get order class for content elements
        const getOrderClass = (elementType: "text" | "image") => {
          if (elementType === "text") {
            if (isReversed && !isStacked) return "lg:order-2";
            if (isStackedReversed) return "order-2";
            return "";
          } else {
            if (isReversed && !isStacked) return "lg:order-1";
            if (isStackedReversed) return "order-1";
            return "";
          }
        };

        return (
          <div className={getGridClass()}>
            <div className={getOrderClass("text")}>
              {block.title && (
                <h3 className="h3 text-theme-heading">{block.title}</h3>
              )}
              <div
                className="text-body-lg text-theme-text-body content-prose"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            {block.image_url && (
              <div className={getOrderClass("image")}>
                <img
                  src={block.image_url}
                  alt={block.image_alt_text || block.title || "Content image"}
                  className="rounded-2xl shadow-soft w-full h-auto"
                />
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="text-center max-w-reading-lg mx-auto">
            <blockquote className="text-2xl italic text-theme-text-body font-light leading-relaxed mb-6">
              "{block.content}"
            </blockquote>
            {block.title && (
              <cite className="text-lg text-theme-text-muted font-medium">
                — {block.title}
              </cite>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="text-center">
            {block.title && (
              <h3 className="h3 text-theme-heading mb-10">{block.title}</h3>
            )}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 content-prose"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );

      case "custom_html":
        return (
          <div>
            {block.title && (
              <h3 className="h3 text-theme-heading text-center mb-8">
                {block.title}
              </h3>
            )}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );

      default:
        return (
          <div>
            {block.title && (
              <h3 className="h3 text-theme-heading">{block.title}</h3>
            )}
            <div
              className="text-body-lg text-theme-text-body content-prose"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
    }
  };

  // Determine container padding based on block type
  const getContainerPadding = () => {
    return "container-padding";
  };

  return (
    <section
      ref={blockRef}
      className={getBlockClasses()}
      style={getBlockStyle()}
    >
      <div
        className={`max-w-7xl mx-auto ${getContainerPadding()} section-spacing`}
      >
        {renderContent()}
      </div>
    </section>
  );
};

export default ContentBlock;
