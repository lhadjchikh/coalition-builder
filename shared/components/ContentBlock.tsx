import React, { useEffect, useRef, useState } from "react";

// Generic content block interface that works with both frontend and SSR
interface ContentBlockData {
  id: string | number;
  title?: string;
  content: string;
  block_type: string;
  image_url?: string;
  image_alt_text?: string;
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
          <div className="prose prose-xl max-w-4xl mx-auto">
            {block.title && (
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {block.title}
              </h3>
            )}
            <div
              className="text-xl text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );

      case "image":
        return (
          <div className="text-center">
            {block.title && (
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {block.title}
              </h3>
            )}
            {block.image_url && (
              <img
                src={block.image_url}
                alt={block.image_alt_text || block.title || "Content image"}
                className="mx-auto rounded-lg shadow-md max-w-full h-auto"
              />
            )}
            {block.content && (
              <div
                className="mt-4 text-xl text-gray-600 max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
          </div>
        );

      case "text_image":
        return (
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 content-block-text">
              {block.title && (
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  {block.title}
                </h3>
              )}
              <div
                className="prose prose-xl text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
            {block.image_url && (
              <div className="flex-1 content-block-image">
                <img
                  src={block.image_url}
                  alt={block.image_alt_text || block.title || "Content image"}
                  className="rounded-lg shadow-md w-full h-auto"
                />
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="text-center max-w-4xl mx-auto">
            <blockquote className="text-2xl italic text-gray-800 mb-4">
              "{block.content}"
            </blockquote>
            {block.title && (
              <cite className="text-xl text-gray-600 font-medium">
                — {block.title}
              </cite>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="text-center">
            {block.title && (
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {block.title}
              </h3>
            )}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xl"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );

      case "custom_html":
        return (
          <div>
            {block.title && (
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {block.title}
              </h3>
            )}
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </div>
        );

      default:
        return (
          <div className="prose prose-xl max-w-none">
            {block.title && (
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {block.title}
              </h3>
            )}
            <div
              className="text-xl text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
    }
  };

  return (
    <div ref={blockRef} className={getBlockClasses()} style={getBlockStyle()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentBlock;
