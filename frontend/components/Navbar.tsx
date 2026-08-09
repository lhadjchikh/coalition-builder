"use client";

import React, { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

import { useNavbarScroll } from "../hooks/useNavbarScroll";
import type { NavItemData } from "../types";
import DesktopNavigation from "./DesktopNavigation";
import MobileNavigation from "./MobileNavigation";
import NavbarBrand from "./NavbarBrand";
import { getNavbarClasses, getNavItemClasses } from "./navbarStyles";

interface NavbarProps {
  organizationName?: string;
  logoUrl?: string;
  logoAltText?: string;
  navItems?: NavItemData[];
  className?: string;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  organizationName = "Coalition Builder",
  logoUrl,
  logoAltText,
  navItems = [],
  className,
  currentView: _currentView,
  onNavigate: _onNavigate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === "/" || pathname === "";
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const { isVisible, scrolled } = useNavbarScroll(closeMenu);
  const showHomepageShadow = isHomepage && !scrolled;
  const itemClasses = (isActive: boolean) =>
    getNavItemClasses(isActive, showHomepageShadow);

  return (
    <nav
      className={
        className || getNavbarClasses({ isHomepage, isVisible, scrolled })
      }
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex items-center justify-between h-24 sm:h-28">
          <NavbarBrand
            organizationName={organizationName}
            logoUrl={logoUrl}
            logoAltText={logoAltText}
            showHomepageShadow={showHomepageShadow}
            closeMenu={closeMenu}
          />
          <DesktopNavigation
            navItems={navItems}
            pathname={pathname}
            getItemClasses={itemClasses}
          />
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen((current) => !current)}
              className="bg-theme-primary inline-flex items-center justify-center p-1.5 sm:p-3 rounded-lg sm:rounded-xl text-white/80 hover:text-white hover:bg-white/10 focus-ring transition-all duration-300 flex-shrink-0"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon
                icon={isMenuOpen ? faTimes : faBars}
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <MobileNavigation
            navItems={navItems}
            pathname={pathname}
            closeMenu={closeMenu}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
