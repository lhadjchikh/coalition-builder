import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroSection from "@shared/components/HeroSection";
import type { HomePage } from "@shared/types/api";

// Mock the Button component
jest.mock("@shared/components/Button", () => ({
  __esModule: true,
  default: ({ children, href, variant, size, className }: any) => (
    <a href={href} className={`${variant} ${size} ${className}`}>
      {children}
    </a>
  ),
}));

// Helper to create mock homepage data
const createMockHomepage = (overrides?: Partial<HomePage>): HomePage => ({
  id: 1,
  organization_name: "Test Org",
  tagline: "Test tagline",
  hero_title: "Welcome to Our Site",
  hero_subtitle: "This is a subtitle",
  hero_background_image_url: "https://example.com/image.jpg",
  hero_background_video_url: null,
  hero_background_video_data: null,
  hero_overlay_enabled: false,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 0.5,
  cta_button_text: "Get Started",
  cta_button_url: "/start",
  content_blocks: [],
  ...overrides,
});

// Mock navigator.connection
const mockConnection = (overrides?: any) => {
  Object.defineProperty(window.navigator, "connection", {
    writable: true,
    configurable: true,
    value: overrides || undefined,
  });
};

describe("HeroSection", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockConnection(undefined);
  });

  describe("Basic Rendering", () => {
    it("renders hero title and subtitle", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      expect(screen.getByText("Welcome to Our Site")).toBeInTheDocument();
      expect(screen.getByText("This is a subtitle")).toBeInTheDocument();
    });

    it("renders CTA button when provided", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText("Get Started");
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute("href", "/start");
    });

    it("does not render CTA button when not provided", () => {
      const homepage = createMockHomepage({
        cta_button_text: null,
        cta_button_url: null,
      });
      render(<HeroSection homepage={homepage} />);

      expect(screen.queryByText("Get Started")).not.toBeInTheDocument();
    });

    it("does not render subtitle when not provided", () => {
      const homepage = createMockHomepage({
        hero_subtitle: null,
      });
      render(<HeroSection homepage={homepage} />);

      expect(screen.queryByText("This is a subtitle")).not.toBeInTheDocument();
    });
  });

  describe("Background Image", () => {
    it("applies background image when provided", () => {
      const homepage = createMockHomepage();
      const { container } = render(<HeroSection homepage={homepage} />);

      const heroDiv = container.firstChild as HTMLElement;
      // Check the inline style attribute directly
      const style = heroDiv.getAttribute("style");
      expect(style).toContain("url(https://example.com/image.jpg)");
    });

    it("applies overlay when enabled", () => {
      const homepage = createMockHomepage({
        hero_overlay_enabled: true,
        hero_overlay_color: "#FF0000",
        hero_overlay_opacity: 0.7,
      });
      const { container } = render(<HeroSection homepage={homepage} />);

      const heroDiv = container.firstChild as HTMLElement;
      // Check the inline style attribute directly
      const style = heroDiv.getAttribute("style");
      expect(style).toContain("rgba(255, 0, 0, 0.7)");
    });

    it("uses white text color with background image", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText("Welcome to Our Site");
      expect(title).toHaveClass("text-white");
    });

    it("uses theme heading color without background", () => {
      const homepage = createMockHomepage({
        hero_background_image_url: null,
      });
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText("Welcome to Our Site");
      expect(title).toHaveClass("text-theme-heading");
    });
  });

  describe("Video Background", () => {
    beforeEach(() => {
      // Mock HTMLVideoElement methods
      HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);
      HTMLVideoElement.prototype.pause = jest.fn();
    });

    it("renders video element when video URL is provided and connection is fast", async () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
        hero_background_video_data: {
          autoplay: true,
          loop: true,
          muted: true,
          show_controls: false,
          alt_text: "Hero video",
        },
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        const video = screen.getByLabelText("Hero video");
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute("autoplay");
        expect(video).toHaveAttribute("loop");
        expect(video).toHaveAttribute("muted");
      }, { timeout: 2000 });
    }, 10000);

    it("does not render video on slow 2g connection", async () => {
      mockConnection({ effectiveType: "2g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Hero background video")).not.toBeInTheDocument();
      });
    });

    it("does not render video on slow-2g connection", async () => {
      mockConnection({ effectiveType: "slow-2g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Hero background video")).not.toBeInTheDocument();
      });
    });

    it("renders video on 3g connection", async () => {
      mockConnection({ effectiveType: "3g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Hero background video")).toBeInTheDocument();
      });
    });

    it("renders video on 5g connection (future-proof)", async () => {
      mockConnection({ effectiveType: "5g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Hero background video")).toBeInTheDocument();
      });
    });

    it("renders video when effectiveType is undefined", async () => {
      mockConnection({ effectiveType: undefined, saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Hero background video")).toBeInTheDocument();
      });
    });

    it("does not render video when data saver is enabled", async () => {
      mockConnection({ effectiveType: "4g", saveData: true });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Hero background video")).not.toBeInTheDocument();
      });
    });

    it("renders video when no connection API is available", async () => {
      mockConnection(undefined);

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Hero background video")).toBeInTheDocument();
      });
    });

    it("respects prefers-reduced-motion", async () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      // Mock matchMedia for reduced motion
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Hero background video")).not.toBeInTheDocument();
      });
    });

    it("uses correct MIME type for video files", async () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      // Test mp4 file
      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      const { container } = render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        const source = container.querySelector("source");
        expect(source).toHaveAttribute("type", "video/mp4");
      }, { timeout: 2000 });
    }, 10000);

    it("shows fallback image as poster when video loads", async () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
        hero_background_image_url: "https://example.com/poster.jpg",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        const video = screen.getByLabelText("Hero background video");
        expect(video).toHaveAttribute("poster", "https://example.com/poster.jpg");
      }, { timeout: 2000 });
    }, 10000);

    it("applies video overlay when enabled", async () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
        hero_overlay_enabled: true,
        hero_overlay_color: "#0000FF",
        hero_overlay_opacity: 0.3,
      });

      const { container } = render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        const video = screen.getByLabelText("Hero background video");
        expect(video).toBeInTheDocument();
        
        // Find the overlay div that follows the video
        const overlay = container.querySelector("video + .absolute.inset-0");
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveStyle({
          backgroundColor: "rgba(0, 0, 255, 0.3)",
        });
      }, { timeout: 2000 });
    }, 10000);
  });

  describe("CTA Button Styling", () => {
    it("uses secondary variant for CTA button", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText("Get Started");
      expect(ctaButton).toHaveClass("secondary");
    });

    it("applies consistent shadow styling", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText("Get Started");
      expect(ctaButton).toHaveClass("shadow-lg hover:shadow-xl");
    });
  });
});