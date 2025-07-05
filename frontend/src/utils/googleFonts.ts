import WebFont from 'webfontloader';

/**
 * Load Google Fonts dynamically using webfontloader
 */
export function loadGoogleFonts(googleFonts: string[]): void {
  if (!googleFonts || googleFonts.length === 0) return;

  // Format fonts for webfontloader (Family:weight1,weight2)
  const formattedFonts = googleFonts.map(family => `${family.trim()}:400,500,600,700`);

  WebFont.load({
    google: {
      families: formattedFonts,
    },
    timeout: 3000, // 3 second timeout
    active: () => {
      console.log('Google Fonts loaded successfully');
    },
    inactive: () => {
      console.warn('Google Fonts failed to load or timed out');
    },
  });
}
