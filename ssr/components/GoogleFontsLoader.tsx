import React from "react";

interface GoogleFontsLoaderProps {
  googleFonts?: string[];
}

const GoogleFontsLoader: React.FC<GoogleFontsLoaderProps> = ({
  googleFonts,
}) => {
  if (!googleFonts || googleFonts.length === 0) {
    return null;
  }

  // Filter out empty strings and format font names using functional approach
  const fontFamilies = googleFonts
    .filter((font) => font && font.trim())
    .map((font) => {
      // Replace spaces with + and add default weights
      const fontName = font.trim().replace(/ /g, "+");
      return `${fontName}:wght@400;500;600;700`;
    });

  if (fontFamilies.length === 0) {
    return null;
  }

  // Create the Google Fonts URL
  const fontsUrl = `https://fonts.googleapis.com/css2?${fontFamilies
    .map((family) => `family=${family}`)
    .join("&")}&display=swap`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={fontsUrl} />
    </>
  );
};

export default GoogleFontsLoader;
