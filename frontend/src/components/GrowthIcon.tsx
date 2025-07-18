import React from 'react';
import { ReactComponent as SeedSvg } from '../assets/icons/seed.svg';
import { ReactComponent as SeedlingSvg } from '../assets/icons/seedling.svg';
import { ReactComponent as TreeSvg } from '../assets/icons/tree.svg';

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

  const getSeedIcon = () => (
    <SeedSvg width={size} height={size} style={iconStyle} className={className} />
  );

  const getSeedlingIcon = () => (
    <SeedlingSvg width={size} height={size} style={iconStyle} className={className} />
  );

  const getTreeIcon = () => (
    <TreeSvg width={size} height={size} style={iconStyle} className={className} />
  );

  switch (stage) {
    case 'seed':
      return getSeedIcon();
    case 'seedling':
      return getSeedlingIcon();
    case 'tree':
      return getTreeIcon();
    default:
      return getSeedIcon();
  }
};

export default GrowthIcon;
