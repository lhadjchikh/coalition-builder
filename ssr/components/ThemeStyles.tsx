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

  return (
    <>
      {cssVariables && (
        <style
          dangerouslySetInnerHTML={{
            __html: cssVariables,
          }}
        />
      )}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
    </>
  );
};

export default ThemeStyles;
