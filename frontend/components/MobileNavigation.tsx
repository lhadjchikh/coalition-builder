import React, { useState } from "react";
import Link from "next/link";

import type { NavItemData } from "../types";
import { getMobileNavItemClasses } from "./navbarStyles";

interface MobileNavigationProps {
  navItems: NavItemData[];
  pathname: string;
  closeMenu: () => void;
}

const MobileSubmenu: React.FC<{
  item: NavItemData;
  pathname: string;
  closeMenu: () => void;
}> = ({ item, pathname, closeMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive =
    item.href === pathname ||
    item.children?.some((child) => child.href === pathname);

  return (
    <div>
      <div className="flex items-center gap-1">
        <Link
          href={item.href || "#"}
          className={`${getMobileNavItemClasses(Boolean(isActive))} flex-1`}
          onClick={closeMenu}
        >
          {item.label}
        </Link>
        <button
          type="button"
          aria-label={`Toggle ${item.label} submenu`}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="focus-ring min-h-11 min-w-11 rounded-md text-white"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span aria-hidden="true">▾</span>
        </button>
      </div>
      {isOpen && (
        <div className="ml-4 space-y-1 border-l border-white/20 pl-3">
          {item.children?.map((child, index) => (
            <Link
              key={`${child.label}-${child.href || index}`}
              href={child.href || "#"}
              className={getMobileNavItemClasses(child.href === pathname)}
              aria-current={child.href === pathname ? "page" : undefined}
              onClick={closeMenu}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  navItems,
  pathname,
  closeMenu,
}) => (
  <div
    className="md:hidden navbar-glass rounded-b-xl"
    data-testid="mobile-navigation"
  >
    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
      {navItems.map((item, index) => {
        const key = `${item.label}-${item.href || index}`;
        if (item.children?.length) {
          return (
            <MobileSubmenu
              key={key}
              item={item}
              pathname={pathname}
              closeMenu={closeMenu}
            />
          );
        }
        if (item.href) {
          return (
            <Link
              key={key}
              href={item.href}
              className={getMobileNavItemClasses(item.href === pathname)}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={key}
            onClick={() => {
              item.onClick?.();
              closeMenu();
            }}
            className={getMobileNavItemClasses(item.active || false, true)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default MobileNavigation;
