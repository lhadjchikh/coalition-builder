import React from 'react';
import seedSvg from '@shared/assets/icons/seed.svg';
import seedlingSvg from '@shared/assets/icons/seedling.svg';
import treeSvg from '@shared/assets/icons/tree.svg';

interface GrowthIconProps {
  stage: 'seed' | 'seedling' | 'tree';
  size?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const GrowthIcon: React.FC<GrowthIconProps> = ({
  stage,
  size = '48px',
  color = 'currentColor',
  className = '',
  style = {},
}) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    color: color,
    ...style,
  };

  const getSvgUrl = () => {
    switch (stage) {
      case 'seed':
        return seedSvg;
      case 'seedling':
        return seedlingSvg;
      case 'tree':
        return treeSvg;
      default:
        return seedSvg;
    }
  };

  return (
    <img
      src={getSvgUrl()}
      alt={`${stage} growth stage icon`}
      width={size}
      height={size}
      style={iconStyle}
      className={className}
    />
  );
};

export default GrowthIcon;
