// Cache for the dynamically imported webfontloader module
let cachedWebFontLoader: any = null;

/**
 * Load Google Fonts dynamically using webfontloader
 * This function is designed to work in both frontend and shared contexts
 */
export function loadGoogleFonts(googleFonts: string[]): void {
  if (!googleFonts || googleFonts.length === 0) return;

  // Only load fonts in browser environment
  if (typeof window === "undefined") return;

  // Dynamic import of webfontloader to avoid issues in SSR/shared contexts
  try {
    // Use dynamic import with string literal to avoid TypeScript module resolution
    const loadWebFont = async () => {
      try {
        // Check if the module is already cached
        if (!cachedWebFontLoader) {
          // Use Function constructor to avoid TypeScript static analysis
          const dynamicImport = new Function(
            "moduleName",
            "return import(moduleName)",
          );
          cachedWebFontLoader = await dynamicImport("webfontloader");
        }
        const WebFont = cachedWebFontLoader.default || cachedWebFontLoader;

        // Format fonts for webfontloader (Family:weight1,weight2)
        // Filter out empty or whitespace-only font names
        const formattedFonts = googleFonts
          .filter((family) => family && family.trim().length > 0)
          .map((family) => `${family.trim()}:400,500,600,700`);

        WebFont.load({
          google: {
            families: formattedFonts,
          },
          timeout: 3000, // 3 second timeout
          active: () => {
            console.log("Google Fonts loaded successfully");
          },
          inactive: () => {
            console.warn("Google Fonts failed to load or timed out");
          },
        });
      } catch (importError) {
        console.warn("Failed to load webfontloader:", importError);
      }
    };

    loadWebFont();
  } catch (error) {
    console.warn("Webfontloader not available:", error);
  }
}
