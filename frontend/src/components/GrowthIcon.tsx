import React, { useMemo } from 'react';

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
  const iconStyle: React.CSSProperties = useMemo(
    () => ({
      width: size,
      height: size,
      color: color,
      ...style,
    }),
    [size, color, style]
  );

  const getSeedIcon = useMemo(
    () => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={iconStyle}
        className={className}
      >
        {/* Acorn shape - cap and nut */}
        <g fill={color}>
          {/* Acorn cap */}
          <path d="M8 8C8 6.5 9.5 5 12 5C14.5 5 16 6.5 16 8C16 9 15.5 9.8 14.5 10.2L14 10.5C13.4 10.8 12.7 11 12 11C11.3 11 10.6 10.8 10 10.5L9.5 10.2C8.5 9.8 8 9 8 8Z" />
          {/* Cap pattern lines */}
          <path
            d="M8.5 8.5L15.5 8.5M9 9L15 9M9.5 9.5L14.5 9.5"
            stroke={color}
            strokeWidth="0.5"
            fill="none"
          />
          {/* Acorn nut */}
          <ellipse cx="12" cy="15" rx="3.5" ry="4.5" />
          {/* Small stem */}
          <rect x="11.5" y="3.5" width="1" height="1.5" rx="0.5" />
        </g>
      </svg>
    ),
    [size, color, className, iconStyle]
  );

  const getSeedlingIcon = useMemo(
    () => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={iconStyle}
        className={className}
      >
        <g fill={color}>
          {/* Sprouting acorn - partial acorn with emerging plant */}
          {/* Remaining acorn cap */}
          <path d="M9 15C9 14 9.5 13 10.5 12.5C11 12.3 11.5 12.2 12 12.2C12.5 12.2 13 12.3 13.5 12.5C14.5 13 15 14 15 15" />
          {/* Acorn nut bottom */}
          <ellipse cx="12" cy="17.5" rx="3" ry="2.5" />

          {/* Emerging stem */}
          <rect x="11.5" y="8" width="1" height="4" rx="0.5" />

          {/* First leaves */}
          <path d="M8 9C8 7.5 9.5 6.5 11.5 6.5C11.8 6.5 12 6.7 12 7C12 7.3 11.8 7.5 11.5 7.5C10.2 7.5 9 8.2 9 9" />
          <path d="M16 9C16 7.5 14.5 6.5 12.5 6.5C12.2 6.5 12 6.7 12 7C12 7.3 12.2 7.5 12.5 7.5C13.8 7.5 15 8.2 15 9" />

          {/* Small roots */}
          <circle cx="10" cy="19.5" r="0.5" />
          <circle cx="14" cy="19.5" r="0.5" />
          <circle cx="12" cy="20" r="0.5" />
        </g>
      </svg>
    ),
    [size, color, className, iconStyle]
  );

  const getTreeIcon = useMemo(
    () => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={iconStyle}
        className={className}
      >
        <g fill={color}>
          {/* Mature oak tree crown */}
          <path d="M12 2C8 2 5 5 5 9C5 11 6 12.5 7.5 13.5C6.5 14 6 15 6 16C6 18 8 20 12 20C16 20 18 18 18 16C18 15 17.5 14 16.5 13.5C18 12.5 19 11 19 9C19 5 16 2 12 2Z" />

          {/* Tree trunk */}
          <rect x="10.5" y="16" width="3" height="6" rx="1.5" />

          {/* Distinctive oak leaf shapes in the crown */}
          <path
            d="M9 8C9 6.5 10 5.5 11.5 5.5C12 5.5 12.5 5.7 12.8 6C13.2 5.7 13.7 5.5 14.2 5.5C15.7 5.5 16.7 6.5 16.7 8"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
          />
          <path
            d="M8 12C8.5 10.5 9.5 9.5 11 9.5C11.5 9.5 12 9.7 12.3 10C12.7 9.7 13.2 9.5 13.7 9.5C15.2 9.5 16.2 10.5 16.7 12"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
          />

          {/* Ground roots indication */}
          <ellipse cx="12" cy="22.5" rx="6" ry="1" opacity="0.3" />
          <circle cx="8" cy="22" r="0.5" opacity="0.6" />
          <circle cx="16" cy="22" r="0.5" opacity="0.6" />
          <circle cx="6" cy="21.5" r="0.3" opacity="0.4" />
          <circle cx="18" cy="21.5" r="0.3" opacity="0.4" />
        </g>
      </svg>
    ),
    [size, color, className, iconStyle]
  );

  switch (stage) {
    case 'seed':
      return getSeedIcon;
    case 'seedling':
      return getSeedlingIcon;
    case 'tree':
      return getTreeIcon;
    default:
      return getSeedIcon;
  }
};

export default GrowthIcon;
