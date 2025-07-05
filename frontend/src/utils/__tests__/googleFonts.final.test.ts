/**
 * Final comprehensive test for Google Fonts functionality
 * Tests the core utility function that handles Google Fonts loading
 */

// Mock webfontloader first
const mockWebFontLoad = jest.fn();
jest.mock('webfontloader', () => ({
  load: mockWebFontLoad,
}));

import { loadGoogleFonts } from '../googleFonts';

describe('Google Fonts Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadGoogleFonts utility', () => {
    it('should load Google Fonts correctly with proper webfontloader configuration', () => {
      const fonts = ['Merriweather', 'Barlow'];

      loadGoogleFonts(fonts);

      expect(mockWebFontLoad).toHaveBeenCalledWith({
        google: {
          families: ['Merriweather:400,500,600,700', 'Barlow:400,500,600,700'],
        },
        timeout: 3000,
        active: expect.any(Function),
        inactive: expect.any(Function),
      });
    });

    it('should handle empty arrays gracefully', () => {
      loadGoogleFonts([]);
      expect(mockWebFontLoad).not.toHaveBeenCalled();
    });

    it('should handle null/undefined inputs', () => {
      loadGoogleFonts(null as any);
      expect(mockWebFontLoad).not.toHaveBeenCalled();

      loadGoogleFonts(undefined as any);
      expect(mockWebFontLoad).not.toHaveBeenCalled();
    });

    it('should format font families with weights correctly', () => {
      const fonts = ['Inter', 'Roboto Slab'];

      loadGoogleFonts(fonts);

      const call = mockWebFontLoad.mock.calls[0][0];
      expect(call.google.families).toEqual([
        'Inter:400,500,600,700',
        'Roboto Slab:400,500,600,700',
      ]);
    });

    it('should trim whitespace from font names', () => {
      const fonts = ['  Open Sans  ', '   Lato   '];

      loadGoogleFonts(fonts);

      const call = mockWebFontLoad.mock.calls[0][0];
      expect(call.google.families).toEqual(['Open Sans:400,500,600,700', 'Lato:400,500,600,700']);
    });

    it('should use correct timeout configuration', () => {
      loadGoogleFonts(['Roboto']);

      const call = mockWebFontLoad.mock.calls[0][0];
      expect(call.timeout).toBe(3000);
    });

    it('should provide success and failure callbacks', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      loadGoogleFonts(['Roboto']);

      const call = mockWebFontLoad.mock.calls[0][0];

      // Test success callback
      call.active();
      expect(mockConsoleLog).toHaveBeenCalledWith('Google Fonts loaded successfully');

      // Test failure callback
      call.inactive();
      expect(mockConsoleWarn).toHaveBeenCalledWith('Google Fonts failed to load or timed out');

      mockConsoleLog.mockRestore();
      mockConsoleWarn.mockRestore();
    });
  });

  describe('Real-world usage scenarios', () => {
    it('should handle Land and Bay Stewards fonts', () => {
      const fonts = ['Merriweather', 'Barlow'];

      loadGoogleFonts(fonts);

      expect(mockWebFontLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          google: {
            families: ['Merriweather:400,500,600,700', 'Barlow:400,500,600,700'],
          },
        })
      );
    });

    it('should handle single font families', () => {
      loadGoogleFonts(['Inter']);

      expect(mockWebFontLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          google: {
            families: ['Inter:400,500,600,700'],
          },
        })
      );
    });

    it('should handle complex font names', () => {
      const fonts = ['Playfair Display', 'Source Sans Pro', 'Noto Sans JP'];

      loadGoogleFonts(fonts);

      expect(mockWebFontLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          google: {
            families: [
              'Playfair Display:400,500,600,700',
              'Source Sans Pro:400,500,600,700',
              'Noto Sans JP:400,500,600,700',
            ],
          },
        })
      );
    });
  });
});
