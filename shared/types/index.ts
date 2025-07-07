/**
 * Shared types used across components
 */

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
  { label: "About", href: "#about-section" },
  { label: "Campaigns", href: "#campaigns-section" },
  { label: "Contact", href: "#footer" },
];
