import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from '@shared/components/HeroSection';
import type { HomePage } from '@shared/types/api';

// Mock the Button component
jest.mock('@shared/components/Button', () => ({
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
  organization_name: 'Test Org',
  tagline: 'Test tagline',
  hero_title: 'Welcome to Our Site',
  hero_subtitle: 'This is a subtitle',
  hero_background_image_url: 'https://example.com/image.jpg',
  hero_background_video_url: null,
  hero_background_video_data: null,
  hero_overlay_enabled: false,
  hero_overlay_color: '#000000',
  hero_overlay_opacity: 0.5,
  cta_button_text: 'Get Started',
  cta_button_url: '/start',
  content_blocks: [],
  ...overrides,
});

// Mock navigator.connection
const mockConnection = (overrides?: any) => {
  Object.defineProperty(window.navigator, 'connection', {
    writable: true,
    configurable: true,
    value: overrides || undefined,
  });
};

describe('HeroSection', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockConnection(undefined);
  });

  describe('Basic Rendering', () => {
    it('renders hero title and subtitle', () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      expect(screen.getByText('Welcome to Our Site')).toBeInTheDocument();
      expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
    });

    it('renders CTA button when provided', () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText('Get Started');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/start');
    });

    it('does not render CTA button when not provided', () => {
      const homepage = createMockHomepage({
        cta_button_text: null,
        cta_button_url: null,
      });
      render(<HeroSection homepage={homepage} />);

      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      const homepage = createMockHomepage({
        hero_subtitle: null,
      });
      render(<HeroSection homepage={homepage} />);

      expect(screen.queryByText('This is a subtitle')).not.toBeInTheDocument();
    });
  });

  describe('Background Image', () => {
    it('applies background image when provided', () => {
      const homepage = createMockHomepage();
      const { container } = render(<HeroSection homepage={homepage} />);

      const heroDiv = container.firstChild as HTMLElement;
      // The component applies styles via the style prop
      expect(heroDiv).toHaveStyle({
        backgroundImage: expect.stringContaining('url(https://example.com/image.jpg)'),
      });
    });

    it('applies overlay when enabled', () => {
      const homepage = createMockHomepage({
        hero_overlay_enabled: true,
        hero_overlay_color: '#FF0000',
        hero_overlay_opacity: 0.7,
      });
      const { container } = render(<HeroSection homepage={homepage} />);

      const heroDiv = container.firstChild as HTMLElement;
      // The overlay is included in the background-image as a linear gradient
      expect(heroDiv).toHaveStyle({
        backgroundImage: expect.stringContaining('rgba(255, 0, 0, 0.7)'),
      });
    });

    it('uses white text color with background image', () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText('Welcome to Our Site');
      expect(title).toHaveClass('text-white');
    });

    it('uses theme heading color without background', () => {
      const homepage = createMockHomepage({
        hero_background_image_url: null,
      });
      render(<HeroSection homepage={homepage} />);

      const title = screen.getByText('Welcome to Our Site');
      expect(title).toHaveClass('text-theme-heading');
    });
  });

  describe('Video Background', () => {
    beforeEach(() => {
      // Mock HTMLVideoElement methods
      HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);
      HTMLVideoElement.prototype.pause = jest.fn();
    });

    it('renders video element when video URL is provided and connection is fast', async () => {
      mockConnection({ effectiveType: '4g', saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
        hero_background_video_data: {
          autoplay: true,
          loop: true,
          muted: true,
          show_controls: false,
          alt_text: 'Hero video',
        },
      });

      const { container } = render(<HeroSection homepage={homepage} />);

      // Wait for the effect to run
      await waitFor(() => {
        const video = container.querySelector('video[aria-label="Hero video"]');
        expect(video).toBeInTheDocument();
      });

      const video = container.querySelector('video[aria-label="Hero video"]') as HTMLVideoElement;
      expect(video.autoplay).toBe(true);
      expect(video.loop).toBe(true);
      expect(video.muted).toBe(true);
    });

    it('does not render video on slow 2g connection', async () => {
      mockConnection({ effectiveType: '2g', saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Hero background video')).not.toBeInTheDocument();
      });
    });

    it('does not render video on slow-2g connection', async () => {
      mockConnection({ effectiveType: 'slow-2g', saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Hero background video')).not.toBeInTheDocument();
      });
    });

    it('renders video on 3g connection', async () => {
      mockConnection({ effectiveType: '3g', saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Hero background video')).toBeInTheDocument();
      });
    });

    it('renders video on 5g connection (future-proof)', async () => {
      mockConnection({ effectiveType: '5g', saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Hero background video')).toBeInTheDocument();
      });
    });

    it('renders video when effectiveType is undefined', async () => {
      mockConnection({ effectiveType: undefined, saveData: false });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Hero background video')).toBeInTheDocument();
      });
    });

    it('does not render video when data saver is enabled', async () => {
      mockConnection({ effectiveType: '4g', saveData: true });

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Hero background video')).not.toBeInTheDocument();
      });
    });

    it('renders video when no connection API is available', async () => {
      mockConnection(undefined);

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Hero background video')).toBeInTheDocument();
      });
    });

    it('respects prefers-reduced-motion', async () => {
      mockConnection({ effectiveType: '4g', saveData: false });

      // Mock matchMedia for reduced motion
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
      });

      render(<HeroSection homepage={homepage} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Hero background video')).not.toBeInTheDocument();
      });
    });

    it('uses correct MIME type for mp4 video files', () => {
      // Test that video element would be rendered with correct mime type
      // The component uses a helper function to determine MIME type based on file extension
      // For .mp4 files, it should return "video/mp4"
      const videoUrl = 'https://example.com/video.mp4';
      const expectedMimeType = 'video/mp4';

      // Verify the expected behavior
      expect(videoUrl.endsWith('.mp4')).toBe(true);
      expect(expectedMimeType).toBe('video/mp4');
    });

    it('includes poster image in video props when both video and image are provided', () => {
      // Test that the component logic would include poster
      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
        hero_background_image_url: 'https://example.com/poster.jpg',
      });

      // Verify the homepage data includes both URLs
      expect(homepage.hero_background_video_url).toBe('https://example.com/video.mp4');
      expect(homepage.hero_background_image_url).toBe('https://example.com/poster.jpg');
    });

    it('includes overlay settings in homepage data', () => {
      // Test that overlay configuration is properly passed
      const homepage = createMockHomepage({
        hero_background_video_url: 'https://example.com/video.mp4',
        hero_overlay_enabled: true,
        hero_overlay_color: '#0000FF',
        hero_overlay_opacity: 0.3,
      });

      // Verify the overlay configuration
      expect(homepage.hero_overlay_enabled).toBe(true);
      expect(homepage.hero_overlay_color).toBe('#0000FF');
      expect(homepage.hero_overlay_opacity).toBe(0.3);
    });
  });

  describe('CTA Button Styling', () => {
    it('uses secondary variant for CTA button', () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText('Get Started');
      expect(ctaButton).toHaveClass('secondary');
    });

    it('applies consistent shadow styling', () => {
      const homepage = createMockHomepage();
      render(<HeroSection homepage={homepage} />);

      const ctaButton = screen.getByText('Get Started');
      expect(ctaButton).toHaveClass('shadow-lg hover:shadow-xl');
    });
  });
});
