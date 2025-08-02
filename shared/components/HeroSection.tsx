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

/**
 * Determines whether a video should load based on the network connection type.
 *
 * @param effectiveType - The effective type of the network connection.
 *   Possible values include "slow-2g", "2g", "3g", "4g", or undefined.
 * @returns Returns `true` if the video should load, or `false` if the connection is too slow.
 */
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
  const hasImage = !!homepage.hero_background_image_url;

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
      // If no connection API, load video immediately
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

  // Apply background image to section only when there's an image but no video
  const heroStyle: React.CSSProperties =
    hasImage && !hasVideo
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
    <section
      className={`relative overflow-hidden -mt-20 ${hasVideo || hasImage ? textColorClass : "bg-theme-bg-section"} ${hasVideo && videoLoading && !hasImage ? "bg-theme-primary" : ""}`}
      style={heroStyle}
    >
      {/* Background Image Layer - Shows while video loads */}
      {hasImage && hasVideo && (
        <div
          className="absolute inset-0 z-0"
          data-testid="hero-background-image"
          data-background-url={homepage.hero_background_image_url}
          style={{
            backgroundImage: `linear-gradient(${overlayStyle}, ${overlayStyle}), url(${homepage.hero_background_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Video Background - Progressive Enhancement */}
      {hasVideo && shouldLoadVideo && !prefersReducedMotion && (
        <>
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10 ${
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
            aria-label={
              homepage.hero_background_video_data?.alt_text ||
              "Hero background video"
            }
            onError={() => {
              setVideoError(true);
              setVideoLoading(false);
            }}
            onLoadStart={() => {
              setVideoError(false);
              setVideoLoading(true);
            }}
            onCanPlay={() => {
              setVideoLoading(false);
            }}
            onLoadedData={() => {
              setVideoLoading(false);
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
              className="absolute inset-0 z-20"
              style={{ backgroundColor: overlayStyle }}
            ></div>
          )}
        </>
      )}

      <div className="relative z-30 section-spacing-lg pt-40">
        <div className="relative max-w-7xl mx-auto container-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`h1 ${textColorClass} font-theme-heading`}>
              {homepage.hero_title}
            </h1>
            {homepage.hero_subtitle && (
              <p className={`lead ${textColorClass} mx-auto text-pretty`}>
                {homepage.hero_subtitle}
              </p>
            )}

            {/* Optional CTA button in hero */}
            {homepage.cta_button_url && homepage.cta_button_text && (
              <div className="mt-8 sm:mt-10">
                <Button
                  href={homepage.cta_button_url}
                  variant="secondary"
                  size="lg"
                  className="shadow-soft hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  {homepage.cta_button_text}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
