"use client";

import React, { useState, useEffect, useRef } from "react";
import type { HomePage } from "../types/api";

interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
}

interface HeroSectionProps {
  homepage: HomePage;
}

// Helper function to get video MIME type from URL
const getVideoMimeType = (url: string): string => {
  if (url.endsWith(".webm")) return "video/webm";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".mov")) return "video/quicktime";
  return "video/mp4"; // Default fallback
};

const HeroSection: React.FC<HeroSectionProps> = ({ homepage }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideo = homepage.hero_background_video_url && !videoError;
  const hasImage =
    homepage.hero_background_image_url &&
    (!homepage.hero_background_video_url || videoError);

  // Check if user has preference for reduced motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Check connection speed
  useEffect(() => {
    if (!hasVideo || prefersReducedMotion) return;

    // Check if user is on a slow connection
    const connection: NetworkInformation | undefined =
      (navigator as Navigator & { connection?: NetworkInformation })
        .connection ||
      (navigator as Navigator & { mozConnection?: NetworkInformation })
        .mozConnection ||
      (navigator as Navigator & { webkitConnection?: NetworkInformation })
        .webkitConnection;

    if (connection) {
      // Respect user's data saving preference
      const saveData = connection.saveData;
      if (saveData) {
        return;
      }

      // Load video only on fast connections (4g, wifi)
      const effectiveType = connection.effectiveType;
      if (effectiveType === "4g" || effectiveType === "wifi") {
        setShouldLoadVideo(true);
      }
    } else {
      // If no connection API, load video after a short delay
      setShouldLoadVideo(true);
    }
  }, [hasVideo, prefersReducedMotion]);

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
      {/* Video Background - Progressive Enhancement */}
      {hasVideo && shouldLoadVideo && !prefersReducedMotion && (
        <>
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoading ? "opacity-0" : "opacity-100"
            }`}
            autoPlay={homepage.hero_background_video_data?.autoplay ?? true}
            loop={homepage.hero_background_video_data?.loop ?? true}
            muted={homepage.hero_background_video_data?.muted ?? true}
            controls={
              homepage.hero_background_video_data?.show_controls ?? false
            }
            playsInline
            preload="metadata"
            poster={homepage.hero_background_image_url || undefined}
            aria-label={
              homepage.hero_background_video_data?.alt_text ||
              "Hero background video"
            }
            onError={() => {
              setVideoError(true);
              setVideoLoading(false);
            }}
            onLoadStart={() => setVideoError(false)}
            onLoadedData={() => {
              setVideoLoading(false);
              // Start playing when data is loaded
              videoRef.current?.play().catch((error) => {
                console.warn("Video autoplay failed:", error);
                // Don't set videoError here as the video can still be played manually
              });
            }}
          >
            <source
              src={homepage.hero_background_video_url}
              type={getVideoMimeType(homepage.hero_background_video_url)}
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
