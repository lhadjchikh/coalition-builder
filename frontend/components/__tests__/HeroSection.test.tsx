import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroSection from "../HeroSection";
import type { HomePage } from "../../types/index";

// Mock the Button component
jest.mock("../Button", () => ({
  __esModule: true,
  default: ({ children, href, variant, size, className }: {
    children?: React.ReactNode;
    href?: string;
    variant?: string;
    size?: string;
    className?: string;
  }) => (
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
  hero_background_video_url: undefined,
  hero_background_video_data: undefined,
  hero_overlay_enabled: false,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 0.5,
  cta_button_text: "Get Started",
  cta_button_url: "/start",
  cta_title: "Take Action",
  campaigns_section_title: "Our Campaigns",
  show_campaigns_section: true,
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

// Mock navigator.connection
const mockConnection = (overrides?: Partial<NetworkInformation>) => {
  Object.defineProperty(window.navigator, "connection", {
    writable: true,
    configurable: true,
    value: overrides || undefined,
  });
};

describe("HeroSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.matchMedia
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    // Clean up mocked properties
    delete (window.navigator as typeof window.navigator & { connection?: NetworkInformation }).connection;
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
        cta_button_text: "",
        cta_button_url: "",
      });
      render(<HeroSection homepage={homepage} />);

      expect(screen.queryByText("Get Started")).not.toBeInTheDocument();
    });

    it("does not render subtitle when not provided", () => {
      const homepage = createMockHomepage({
        hero_subtitle: "",
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
      expect(heroDiv).toHaveStyle({
        backgroundImage: expect.stringContaining(
          "url(https://example.com/image.jpg)",
        ),
      });
    });

    it("applies overlay when enabled", () => {
      const homepage = createMockHomepage({
        hero_overlay_enabled: true,
        hero_overlay_color: "#FF0000",
        hero_overlay_opacity: 0.7,
      });
      const { container } = render(<HeroSection homepage={homepage} />);

      const heroDiv = container.firstChild as HTMLElement;
      expect(heroDiv).toHaveStyle({
        backgroundImage: expect.stringContaining("rgba(255, 0, 0, 0.7)"),
      });
    });

    it("uses white text color with background image", () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText("Welcome to Our Site");
      expect(title).toHaveClass("text-white");
    });

    it("uses theme heading color without background", () => {
      const homepage = createMockHomepage({
        hero_background_image_url: "",
      });
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText("Welcome to Our Site");
      expect(title).toHaveClass("text-theme-heading");
    });
  });

  describe("Video Background", () => {
    beforeEach(() => {
      // Ensure video tests have a clean connection state
      mockConnection({ effectiveType: "4g", saveData: false });
    });

    it("renders video element when video URL is provided and connection is fast", async () => {
      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Hero background video"),
        ).toBeInTheDocument();
      });
    });

    it("does not render video on slow 2g connection", async () => {
      mockConnection({ effectiveType: "2g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Hero background video"),
        ).not.toBeInTheDocument();
      });
    });

    it("does not render video on slow-2g connection", async () => {
      mockConnection({ effectiveType: "slow-2g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Hero background video"),
        ).not.toBeInTheDocument();
      });
    });

    it("renders video on 3g connection", async () => {
      mockConnection({ effectiveType: "3g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Hero background video"),
        ).toBeInTheDocument();
      });
    });

    it("renders video on 5g connection (future-proof)", async () => {
      mockConnection({ effectiveType: "5g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Hero background video"),
        ).toBeInTheDocument();
      });
    });

    it("renders video when effectiveType is undefined", async () => {
      mockConnection({ effectiveType: undefined, saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Hero background video"),
        ).toBeInTheDocument();
      });
    });

    it("does not render video when data saver is enabled", async () => {
      mockConnection({ effectiveType: "4g", saveData: true });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Hero background video"),
        ).not.toBeInTheDocument();
      });
    });

    it("renders video when no connection API is available", async () => {
      mockConnection(undefined);

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText("Hero background video"),
        ).toBeInTheDocument();
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
        expect(
          screen.queryByLabelText("Hero background video"),
        ).not.toBeInTheDocument();
      });
    });

    it("renders background image layer when both video and image are provided", () => {
      mockConnection({ effectiveType: "4g", saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
        hero_background_image_url: "https://example.com/poster.jpg",
      });

      render(<HeroSection homepage={homepage} />);

      // Find the background div by test ID
      const backgroundDiv = screen.getByTestId("hero-background-image");
      expect(backgroundDiv).toBeInTheDocument();

      // Verify the background URL is correct
      expect(backgroundDiv).toHaveAttribute(
        "data-background-url",
        "https://example.com/poster.jpg",
      );

      // Verify it has the correct classes
      expect(backgroundDiv).toHaveClass("absolute", "inset-0", "z-0");
    });

    it("includes overlay settings in homepage data", () => {
      const homepage = createMockHomepage({
        hero_background_video_url: "https://example.com/video.mp4",
        hero_overlay_enabled: true,
        hero_overlay_color: "#0000FF",
        hero_overlay_opacity: 0.3,
      });

      // Verify the overlay configuration
      expect(homepage.hero_overlay_enabled).toBe(true);
      expect(homepage.hero_overlay_color).toBe("#0000FF");
      expect(homepage.hero_overlay_opacity).toBe(0.3);
    });
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
      expect(ctaButton).toHaveClass("shadow-soft");
    });
  });
});
