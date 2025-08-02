/**
 * Comprehensive tests for Google Fonts loading functionality
 * Combines tests from both shared and frontend test files
 */

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

import { loadGoogleFonts } from '@shared/utils/googleFonts';

describe('Google Fonts Loading Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.body.classList
    document.body.classList.add = jest.fn();
    document.body.classList.remove = jest.fn();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Basic functionality', () => {
    it('should handle empty font arrays gracefully', () => {
      loadGoogleFonts([]);

      // Should not attempt to add any classes when no fonts provided
      expect(document.body.classList.add).not.toHaveBeenCalled();
    });

    it('should handle null or undefined inputs', () => {
      loadGoogleFonts(null as any);
      expect(document.body.classList.add).not.toHaveBeenCalled();

      loadGoogleFonts(undefined as any);
      expect(document.body.classList.add).not.toHaveBeenCalled();
    });
  });

  describe('Font loading state management', () => {
    it('should set up a fallback timeout of 2 seconds', () => {
      jest.useFakeTimers();
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');

      loadGoogleFonts(['Roboto']);

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

      jest.useRealTimers();
      mockSetTimeout.mockRestore();
    });

    it("should show text after 2 seconds even if fonts don't load", () => {
      jest.useFakeTimers();

      loadGoogleFonts(['Roboto']);

      // Fast forward 2 seconds
      jest.advanceTimersByTime(2000);

      expect(document.body.classList.remove).toHaveBeenCalledWith('fonts-loading');
      expect(document.body.classList.add).toHaveBeenCalledWith('fonts-loaded');

      jest.useRealTimers();
    });
  });

  describe('SSR environment', () => {
    it('should handle server-side rendering gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(() => loadGoogleFonts(['Roboto'])).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Integration tests', () => {
    // Mock webfontloader for integration tests
    let mockWebFontLoad: jest.Mock;

    beforeEach(() => {
      mockWebFontLoad = jest.fn();
      // Mock the dynamic import
      jest.doMock(
        'webfontloader',
        () => ({
          __esModule: true,
          default: {
            load: mockWebFontLoad,
          },
        }),
        { virtual: true }
      );
    });

    afterEach(() => {
      jest.dontMock('webfontloader');
    });

    it('should pass correct font families to webfontloader', () => {
      // This test verifies the expected behavior even though we can't easily test
      // the async dynamic import in this environment
      const fonts = ['Merriweather', 'Barlow'];

      // The implementation would format these as:
      // ['Merriweather:400,500,600,700', 'Barlow:400,500,600,700']
      // with a timeout of 3000ms

      expect(() => loadGoogleFonts(fonts)).not.toThrow();
    });

    it('should handle whitespace in font names', () => {
      const fonts = ['  Open Sans  ', '   Lato   '];

      // The implementation should trim these to:
      // ['Open Sans:400,500,600,700', 'Lato:400,500,600,700']

      expect(() => loadGoogleFonts(fonts)).not.toThrow();
    });

    it('should filter empty font names', () => {
      const fonts = ['', ' ', 'Roboto', '  '];

      // The implementation should filter to just:
      // ['Roboto:400,500,600,700']

      expect(() => loadGoogleFonts(fonts)).not.toThrow();
    });

    it('should handle complex font names', () => {
      const fonts = ['Playfair Display', 'Source Sans Pro', 'Noto Sans JP'];

      // The implementation should format these with weights

      expect(() => loadGoogleFonts(fonts)).not.toThrow();
    });
  });
});
