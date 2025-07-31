"use client";

import React, { useState, useEffect, useRef } from "react";
import type { HomePage } from "../types/api";
import Button from "./Button";

interface NetworkInformation {
  effectiveType?: string;
  saveData?: boolean;
}

interface HeroSectionProps {
  homepage: HomePage;
}

// Helper function to get video MIME type from URL
const getVideoMimeType = (url: string | undefined): string => {
  if (!url) return "video/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".mov")) return "video/quicktime";
  return "video/mp4"; // Default fallback
};

// Helper function to determine if video should load based on connection
const shouldLoadVideoForConnection = (
  effectiveType: string | undefined,
): boolean => {
  // Load video unless on slow connections
  return (
    !effectiveType || (effectiveType !== "slow-2g" && effectiveType !== "2g")
  );
};

// Helper function to get network information with proper typing
const getNetworkInformation = (): NetworkInformation | undefined => {
  if (typeof navigator === "undefined") return undefined;

  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };

  return nav.connection || nav.mozConnection || nav.webkitConnection;
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
    const connection = getNetworkInformation();

    if (connection) {
      // Respect user's data saving preference
      const saveData = connection.saveData;
      if (saveData) {
        return;
      }

      // Load video unless on slow connections
      const effectiveType = connection.effectiveType;
      if (shouldLoadVideoForConnection(effectiveType)) {
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
                console.warn(
                  `Video autoplay failed for URL: ${
                    homepage.hero_background_video_url || "unknown"
                  }. Error:`,
                  error,
                );
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
            className={`text-4xl font-bold ${textColorClass} sm:text-5xl lg:text-6xl`}
          >
            {homepage.hero_title}
          </h1>
          {homepage.hero_subtitle && (
            <p
              className={`mt-6 text-xl font-theme-body ${textColorClass} max-w-reading-lg mx-auto leading-relaxed`}
            >
              {homepage.hero_subtitle}
            </p>
          )}

          {/* Optional CTA button in hero */}
          {homepage.cta_button_url && homepage.cta_button_text && (
            <div className="mt-10">
              <Button
                href={homepage.cta_button_url}
                variant="secondary"
                size="lg"
                className="shadow-lg hover:shadow-xl"
              >
                {homepage.cta_button_text}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
