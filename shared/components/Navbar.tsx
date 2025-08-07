"use client";

import React, { useState, useEffect } from "react";
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
  LinkComponent?: React.ComponentType<{
    to?: string;
    href?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }>;
  useLocation?: () => { pathname: string };
}

const Navbar: React.FC<NavbarProps> = ({
  organizationName = "Coalition Builder",
  logoUrl,
  logoAltText,
  navItems = [],
  className,
  currentView,
  onNavigate,
  LinkComponent = ({ href, to, children, className, onClick }: any) => (
    <a href={href || to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
  useLocation,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation?.();
  const isHomepage = location?.pathname === "/" || location?.pathname === "";

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Update scrolled state
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

    // Set initial state
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
    if (!location || !href) return false;
    return location.pathname === href;
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
      "flex items-center hover:opacity-80 transition-opacity duration-200";

    if (!logoUrl) {
      const textClasses = "text-xl font-bold";
      const colorClasses =
        isHomepage && !scrolled ? "text-white drop-shadow-lg" : "text-white";
      return `${baseClasses} ${textClasses} ${colorClasses}`;
    }

    return baseClasses;
  };

  // Build nav item classes
  const getNavItemClasses = (isActive: boolean) => {
    const baseClasses =
      "px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300";

    const stateClasses = isActive
      ? "bg-white/20 text-white shadow-soft"
      : "text-white/90 hover:bg-white/10 hover:text-white";

    const shadowClasses = isHomepage && !scrolled ? "drop-shadow-lg" : "";

    return `${baseClasses} ${stateClasses} ${shadowClasses}`.trim();
  };

  // Build mobile nav item classes
  const getMobileNavItemClasses = (isActive: boolean, isButton = false) => {
    const baseClasses = `${isButton ? "block w-full text-left" : "block"} px-3 py-2 rounded-md ${isButton ? "text-base" : "text-lg"} font-medium transition-colors duration-200`;

    const stateClasses = isActive
      ? "bg-theme-primary-dark text-white"
      : "text-white/90 hover:bg-white/10 hover:text-white";

    return `${baseClasses} ${stateClasses}`;
  };

  return (
    <nav className={getNavbarClasses()}>
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex items-center h-20">
          {/* Brand */}
          <div className="flex-shrink-0">
            <LinkComponent
              to="/"
              href="/"
              className={getBrandLinkClasses()}
              onClick={closeMenu}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAltText || `${organizationName} logo`}
                  className="h-14 w-auto py-2"
                />
              ) : (
                organizationName
              )}
            </LinkComponent>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block ml-auto">
            <div className="flex items-baseline space-x-2">
              {navItems.map((item, index) => {
                const isActive = isActiveLink(item.href);

                if (item.href) {
                  return (
                    <LinkComponent
                      key={`nav-item-${index}-${item.label}`}
                      to={item.href}
                      href={item.href}
                      className={getNavItemClasses(isActive)}
                    >
                      {item.label}
                    </LinkComponent>
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
          <div className="md:hidden ml-auto">
            <button
              onClick={toggleMenu}
              className="bg-theme-primary inline-flex items-center justify-center p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 focus-ring transition-all duration-300"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon 
                icon={isMenuOpen ? faTimes : faBars} 
                className="h-6 w-6"
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
                    <LinkComponent
                      key={`mobile-nav-item-${index}-${item.label}`}
                      to={item.href}
                      href={item.href}
                      className={getMobileNavItemClasses(isActive)}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </LinkComponent>
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
                        true,
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
