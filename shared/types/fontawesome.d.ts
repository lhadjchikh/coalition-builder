// Type declarations for FontAwesome packages used in shared components
declare module '@fortawesome/react-fontawesome' {
  import { FC } from 'react';
  
  export interface IconDefinition {
    prefix: string;
    iconName: string;
    icon: any;
  }
  
  export interface FontAwesomeIconProps {
    icon: IconDefinition;
    className?: string;
    size?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
    spin?: boolean;
    pulse?: boolean;
    border?: boolean;
    pull?: 'left' | 'right';
    inverse?: boolean;
    listItem?: boolean;
    rotation?: 90 | 180 | 270;
    flip?: 'horizontal' | 'vertical' | 'both';
    fixedWidth?: boolean;
    mask?: IconDefinition;
    transform?: string | object;
    symbol?: boolean | string;
    style?: React.CSSProperties;
    tabIndex?: number;
    title?: string;
    titleId?: string;
    swapOpacity?: boolean;
  }
  
  export const FontAwesomeIcon: FC<FontAwesomeIconProps>;
}

declare module '@fortawesome/free-solid-svg-icons' {
  export interface IconDefinition {
    prefix: string;
    iconName: string;
    icon: any;
  }
  
  export const faShare: IconDefinition;
  export const faTimes: IconDefinition;
  export const faBullhorn: IconDefinition;
  export const faHandHoldingHeart: IconDefinition;
  export const faBars: IconDefinition;
  export const faX: IconDefinition;
  export const faHouse: IconDefinition;
  export const faBullseye: IconDefinition;
  export const faInfoCircle: IconDefinition;
  export const faEnvelope: IconDefinition;
  export const faShieldAlt: IconDefinition;
  export const faFileContract: IconDefinition;
  export const faExternalLinkAlt: IconDefinition;
  export const faLink: IconDefinition;
  export const faCheck: IconDefinition;
  export const faUserCheck: IconDefinition;
  export const faPaperPlane: IconDefinition;
}

declare module '@fortawesome/free-brands-svg-icons' {
  export interface IconDefinition {
    prefix: string;
    iconName: string;
    icon: any;
  }
  
  export const faFacebook: IconDefinition;
  export const faLinkedin: IconDefinition;
  export const faBluesky: IconDefinition;
  export const faXTwitter: IconDefinition;
  export const faTwitter: IconDefinition;
  export const faInstagram: IconDefinition;
  export const faYoutube: IconDefinition;
  export const faTiktok: IconDefinition;
  export const faThreads: IconDefinition;
  export const faMastodon: IconDefinition;
}