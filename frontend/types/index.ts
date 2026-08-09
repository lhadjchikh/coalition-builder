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
  children?: NavItemData[];
};

/**
 * Default navigation items for SSR
 */
export const DEFAULT_NAV_ITEMS: NavItemData[] = [
  {
    label: "About Us",
    href: "/about",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Our Team", href: "/team" },
    ],
  },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Contact", href: "/contact" },
];

export function getDefaultNavItems(hasTeamContent: boolean): NavItemData[] {
  return DEFAULT_NAV_ITEMS.map((navItem) => {
    if (!navItem.children || hasTeamContent) {
      return navItem;
    }

    return {
      ...navItem,
      children: navItem.children.filter((child) => child.href !== "/team"),
    };
  });
}
