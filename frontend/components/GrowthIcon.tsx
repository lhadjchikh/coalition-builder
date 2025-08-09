import React from "react";
import Image from "next/image";

interface GrowthIconProps {
  stage: "seed" | "seedling" | "tree";
  size?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GrowthIcon: React.FC<GrowthIconProps> = ({
  stage,
  size = "48px",
  color = "currentColor",
  className = "",
  style = {},
}) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    color: color,
    opacity: 0.8,
    ...style,
  };

  const getSvgUrl = () => {
    switch (stage) {
      case "seed":
        return "/assets/icons/seed.svg";
      case "seedling":
        return "/assets/icons/seedling.svg";
      case "tree":
        return "/assets/icons/tree.svg";
      default:
        return "/assets/icons/seed.svg";
    }
  };

  // Parse size to number for Next.js Image component
  const sizeNum = parseInt(size.replace('px', '')) || 48;

  return (
    <Image
      src={getSvgUrl()}
      alt={`${stage} growth stage icon`}
      width={sizeNum}
      height={sizeNum}
      style={iconStyle}
      className={className}
    />
  );
};

export default GrowthIcon;
