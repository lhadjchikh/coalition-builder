/**
 * Shared types used across components
 */

export type NavItemData = {
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
};
