import React, { useRef, useState } from "react";
import Link from "next/link";

import type { NavItemData } from "../types";

interface DesktopNavigationProps {
  navItems: NavItemData[];
  pathname: string;
  getItemClasses: (isActive: boolean) => string;
}

function isItemActive(item: NavItemData, pathname: string): boolean {
  return (
    item.href === pathname ||
    item.children?.some((child) => child.href === pathname) === true
  );
}

const DesktopSubmenu: React.FC<{
  item: NavItemData;
  pathname: string;
  getItemClasses: (isActive: boolean) => string;
}> = ({ item, pathname, getItemClasses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstChildRef = useRef<HTMLAnchorElement>(null);
  const suppressFocusOpen = useRef(false);
  const submenuId = `desktop-submenu-${item.label.toLowerCase().replaceAll(" ", "-")}`;

  const openAndFocusFirstChild = () => {
    setIsOpen(true);
    window.requestAnimationFrame(() => firstChildRef.current?.focus());
  };

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    if (document.activeElement !== triggerRef.current) {
      suppressFocusOpen.current = true;
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      className="relative flex items-center"
      data-testid={`desktop-nav-group-${item.label.toLowerCase().replaceAll(" ", "-")}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) {
          setIsOpen(false);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          closeAndRestoreFocus();
        }
      }}
    >
      <Link
        href={item.href || "#"}
        className={getItemClasses(isItemActive(item, pathname))}
      >
        {item.label}
      </Link>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Toggle ${item.label} submenu`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={submenuId}
        className="focus-ring -ml-3 px-2 py-2 text-white"
        onFocus={() => {
          if (suppressFocusOpen.current) {
            suppressFocusOpen.current = false;
          } else {
            setIsOpen(true);
          }
        }}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openAndFocusFirstChild();
          }
        }}
      >
        <span aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div
          id={submenuId}
          className="absolute left-0 top-full z-50 mt-1 min-w-48 rounded-xl navbar-glass p-2 shadow-lg"
        >
          {item.children?.map((child, index) => (
            <Link
              ref={index === 0 ? firstChildRef : undefined}
              key={`${child.label}-${child.href || index}`}
              href={child.href || "#"}
              className={`${getItemClasses(child.href === pathname)} block`}
              aria-current={child.href === pathname ? "page" : undefined}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  navItems,
  pathname,
  getItemClasses,
}) => (
  <div className="hidden md:block">
    <div className="flex items-baseline space-x-2">
      {navItems.map((item, index) => {
        const key = `${item.label}-${item.href || index}`;
        if (item.children?.length) {
          return (
            <DesktopSubmenu
              key={key}
              item={item}
              pathname={pathname}
              getItemClasses={getItemClasses}
            />
          );
        }
        if (item.href) {
          return (
            <Link
              key={key}
              href={item.href}
              className={getItemClasses(item.href === pathname)}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={key}
            onClick={item.onClick}
            className={getItemClasses(item.active || false)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default DesktopNavigation;
