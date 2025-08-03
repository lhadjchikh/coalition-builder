/**
 * Shared types used across components
 */

// Re-export all API types
export * from "./api";

// Navigation types
export type NavItemData = {
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
};

/**
 * Default navigation items for SSR
 */
export const DEFAULT_NAV_ITEMS: Pick<NavItemData, "label" | "href">[] = [
  { label: "About", href: "/about" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Contact", href: "/contact" },
];
