"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { NavItemData } from "../types";

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
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const isHomepage = pathname === "/" || pathname === "";

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          setScrolled(currentScrollY > 20);

          // Determine scroll direction and visibility
          if (currentScrollY <= 0) {
            // At the top - always show
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
            // Scrolling down & past 80px - hide
            setIsVisible(false);
            setIsMenuOpen(false); // Close mobile menu when hiding
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up - show
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
      }
    };

    const offset = window.scrollY;
    setScrolled(offset > 20);
    setLastScrollY(offset);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActiveLink = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  // Build navbar classes in a more readable way
  const getNavbarClasses = () => {
    if (className) return className;

    const baseClasses =
      "top-0 left-0 right-0 z-50 border-b transition-all duration-300 transform";
    const positionClass = isHomepage ? "fixed" : "sticky";
    const visibilityClass = isVisible ? "translate-y-0" : "-translate-y-full";

    let appearanceClasses: string;
    if (isHomepage) {
      appearanceClasses = scrolled
        ? "navbar-glass border-white/10"
        : "bg-transparent border-transparent";
    } else {
      appearanceClasses = "navbar-glass border-white/10";
    }

    return `${positionClass} ${baseClasses} ${visibilityClass} ${appearanceClasses}`;
  };

  // Build brand link classes
  const getBrandLinkClasses = () => {
    const baseClasses =
      "flex items-center transition-all duration-300 transform hover:scale-105";

    if (!logoUrl) {
      const textClasses = "text-xl sm:text-2xl font-bold truncate";
      const colorClasses =
        isHomepage && !scrolled ? "text-white drop-shadow-lg" : "text-white";
      return `${baseClasses} ${textClasses} ${colorClasses}`;
    }

    return baseClasses;
  };

  // Build nav item classes
  const getNavItemClasses = (isActive: boolean) => {
    const baseClasses =
      "px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300 transform hover:scale-105";

    const stateClasses = isActive
      ? "bg-white/20 text-white shadow-soft"
      : "text-white/90 hover:bg-white/10 hover:text-white";

    const shadowClasses = isHomepage && !scrolled ? "drop-shadow-lg" : "";

    return `${baseClasses} ${stateClasses} ${shadowClasses}`.trim();
  };

  // Build mobile nav item classes
  const getMobileNavItemClasses = (isActive: boolean, isButton = false) => {
    const baseClasses = `${
      isButton ? "block w-full text-left" : "block"
    } px-3 py-2 rounded-md ${
      isButton ? "text-base" : "text-lg"
    } font-medium transition-all duration-300 transform hover:scale-[1.02]`;

    const stateClasses = isActive
      ? "bg-theme-primary-dark text-white"
      : "text-white/90 hover:bg-white/10 hover:text-white";

    return `${baseClasses} ${stateClasses}`;
  };

  return (
    <nav className={getNavbarClasses()}>
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex items-center justify-between h-24 sm:h-28">
          {/* Brand */}
          <div className="flex-shrink-0 min-w-0 mr-3 sm:mr-4 max-w-[calc(100%-56px)] sm:max-w-none">
            <Link
              href="/"
              className={getBrandLinkClasses()}
              onClick={closeMenu}
            >
              {logoUrl ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 flex-shrink-0">
                    <Image
                      src={logoUrl}
                      alt=""
                      aria-hidden="true"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
                      priority
                    />
                  </div>
                  <span
                    className="font-theme-heading text-white font-semibold text-base sm:text-lg lg:text-xl leading-tight drop-shadow-lg"
                  >
                    {organizationName}
                  </span>
                </div>
              ) : (
                organizationName
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-2">
              {navItems.map((item, index) => {
                const isActive = isActiveLink(item.href);

                if (item.href) {
                  return (
                    <Link
                      key={`nav-item-${index}-${item.label}`}
                      href={item.href}
                      className={getNavItemClasses(isActive)}
                    >
                      {item.label}
                    </Link>
                  );
                } else {
                  return (
                    <button
                      key={`nav-item-${index}-${item.label}`}
                      onClick={item.onClick}
                      className={getNavItemClasses(item.active || false)}
                    >
                      {item.label}
                    </button>
                  );
                }
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={toggleMenu}
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden navbar-glass rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item, index) => {
                const isActive = isActiveLink(item.href);

                if (item.href) {
                  return (
                    <Link
                      key={`mobile-nav-item-${index}-${item.label}`}
                      href={item.href}
                      className={getMobileNavItemClasses(isActive)}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  );
                } else {
                  return (
                    <button
                      key={`mobile-nav-item-${index}-${item.label}`}
                      onClick={() => {
                        item.onClick?.();
                        closeMenu();
                      }}
                      className={getMobileNavItemClasses(
                        item.active || false,
                        true
                      )}
                    >
                      {item.label}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
