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

  // Track timeout to ensure it's always cleared
  let fallbackTimeout: NodeJS.Timeout | null = null;

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
            "return import(moduleName)"
          );
          cachedWebFontLoader = await dynamicImport("webfontloader");
        }
        const WebFont = cachedWebFontLoader.default || cachedWebFontLoader;

        // Format fonts for webfontloader (Family:weight1,weight2)
        // Filter out empty or whitespace-only font names
        const formattedFonts = googleFonts
          .filter((family) => family && family.trim().length > 0)
          .map((family) => `${family.trim()}:400,500,600,700`);

        // Add loading class to body
        document.body.classList.add("fonts-loading");

        // Set fallback timeout after we know fonts will be loaded
        fallbackTimeout = setTimeout(() => {
          document.body.classList.remove("fonts-loading");
          document.body.classList.add("fonts-loaded");
        }, 2000); // Show text after 2 seconds regardless

        WebFont.load({
          google: {
            families: formattedFonts,
          },
          timeout: 3000, // 3 second timeout
          loading: () => {
            // Fonts are being loaded
            document.body.classList.add("fonts-loading");
          },
          active: () => {
            // All fonts have loaded successfully
            console.log("Google Fonts loaded successfully");
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
            document.body.classList.remove("fonts-loading");
            document.body.classList.add("fonts-loaded");
          },
          inactive: () => {
            // Fonts failed to load or timed out - show text anyway
            console.warn("Google Fonts failed to load or timed out");
            if (fallbackTimeout) clearTimeout(fallbackTimeout);
            document.body.classList.remove("fonts-loading");
            document.body.classList.add("fonts-loaded");
          },
        });
      } catch (importError) {
        console.warn("Failed to load webfontloader:", importError);
        // Clean up timeout if import fails
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        // Ensure fonts are shown even if import fails
        document.body.classList.remove("fonts-loading");
        document.body.classList.add("fonts-loaded");
      }
    };

    loadWebFont();
  } catch (error) {
    console.warn("Webfontloader not available:", error);
  }
}
