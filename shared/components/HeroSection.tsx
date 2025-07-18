import React, { useState } from "react";
import type { HomePage } from "../types/api";

interface HeroSectionProps {
  homepage: HomePage;
}

const HeroSection: React.FC<HeroSectionProps> = ({ homepage }) => {
  const [videoError, setVideoError] = useState(false);
  const hasVideo = homepage.hero_background_video_url && !videoError;
  const hasImage =
    homepage.hero_background_image_url &&
    (!homepage.hero_background_video_url || videoError);

  // Helper function to convert hex color to rgba
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Generate overlay style based on configuration
  const overlayStyle = homepage.hero_overlay_enabled
    ? hexToRgba(homepage.hero_overlay_color, homepage.hero_overlay_opacity)
    : "rgba(0, 0, 0, 0)";

  const heroStyle: React.CSSProperties = hasImage
    ? {
        backgroundImage: `linear-gradient(${overlayStyle}, ${overlayStyle}), url(${homepage.hero_background_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  const textColorClass =
    hasVideo || hasImage ? "text-white" : "text-theme-heading";

  return (
    <div
      className={`relative py-24 sm:py-32 ${hasVideo || hasImage ? textColorClass : "bg-theme-bg-section"}`}
      style={heroStyle}
    >
      {/* Video Background */}
      {hasVideo && (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={homepage.hero_background_video_data?.autoplay ?? true}
            loop={homepage.hero_background_video_data?.loop ?? true}
            muted={homepage.hero_background_video_data?.muted ?? true}
            controls={
              homepage.hero_background_video_data?.show_controls ?? false
            }
            playsInline
            aria-label={
              homepage.hero_background_video_data?.alt_text ||
              "Hero background video"
            }
            onError={() => setVideoError(true)}
            onLoadStart={() => setVideoError(false)}
          >
            <source src={homepage.hero_background_video_url} type="video/mp4" />
            <source
              src={homepage.hero_background_video_url}
              type="video/quicktime"
            />
            Your browser does not support the video tag.
          </video>
          {/* Configurable overlay for better text readability */}
          {homepage.hero_overlay_enabled && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: overlayStyle }}
            ></div>
          )}
        </>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className={`text-4xl font-bold font-theme-heading ${textColorClass} sm:text-5xl lg:text-6xl`}
          >
            {homepage.hero_title}
          </h1>
          {homepage.hero_subtitle && (
            <p
              className={`mt-6 text-xl font-theme-body ${textColorClass} max-w-3xl mx-auto leading-relaxed`}
            >
              {homepage.hero_subtitle}
            </p>
          )}

          {/* Optional CTA button in hero */}
          {homepage.cta_button_url && homepage.cta_button_text && (
            <div className="mt-10">
              <a
                href={homepage.cta_button_url}
                className={`inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-200 ${
                  homepage.hero_background_image_url
                    ? "text-theme-heading bg-white hover:bg-theme-bg-section"
                    : "text-white bg-theme-primary hover:bg-theme-primary/90"
                }`}
              >
                {homepage.cta_button_text}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
