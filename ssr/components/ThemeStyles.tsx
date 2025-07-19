import React from "react";

interface ThemeStylesProps {
  cssVariables?: string;
  customCss?: string;
}

const ThemeStyles: React.FC<ThemeStylesProps> = ({
  cssVariables,
  customCss,
}) => {
  if (!cssVariables && !customCss) {
    return null;
  }

  // Global heading styles to use theme fonts
  const headingStyles = `
    h1, h2, h3 {
      font-family: var(--theme-font-heading), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
  `;

  return (
    <>
      {cssVariables && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${cssVariables} }`,
          }}
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: headingStyles }} />
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
    </>
  );
};

export default ThemeStyles;
