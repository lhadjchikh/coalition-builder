"use client";

import React, { useState, useEffect } from "react";
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
  const location = useLocation?.();
  const isHomepage = location?.pathname === "/" || location?.pathname === "";

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);
    };

    // Set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <nav
      className={
        className ||
        `${isHomepage ? "fixed" : "sticky"} top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
          isHomepage
            ? scrolled
              ? "navbar-glass border-white/10"
              : "bg-transparent border-transparent"
            : "navbar-glass border-white/10"
        }`
      }
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-20">
          {/* Brand */}
          <div className="flex-shrink-0">
            <LinkComponent
              to="/"
              href="/"
              className={`flex items-center hover:opacity-80 transition-opacity duration-200 ${
                !logoUrl
                  ? `text-xl font-bold ${
                      isHomepage && !scrolled
                        ? "text-white drop-shadow-lg"
                        : "text-white"
                    }`
                  : ""
              }`}
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
          <div className="hidden md:block">
            <div className="ml-12 flex items-baseline space-x-2">
              {navItems.map((item, index) => {
                const isActive = isActiveLink(item.href);

                if (item.href) {
                  return (
                    <LinkComponent
                      key={`nav-item-${index}-${item.label}`}
                      to={item.href}
                      href={item.href}
                      className={`px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 text-white shadow-soft"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      } ${isHomepage && !scrolled ? "drop-shadow-lg" : ""}`}
                    >
                      {item.label}
                    </LinkComponent>
                  );
                } else {
                  return (
                    <button
                      key={`nav-item-${index}-${item.label}`}
                      onClick={item.onClick}
                      className={`px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-300 ${
                        item.active
                          ? "bg-white/20 text-white shadow-soft"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      } ${isHomepage && !scrolled ? "drop-shadow-lg" : ""}`}
                    >
                      {item.label}
                    </button>
                  );
                }
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-theme-primary inline-flex items-center justify-center p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 focus-ring transition-all duration-300"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
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
                      className={`block px-3 py-2 rounded-md text-lg font-medium transition-colors duration-200 ${
                        isActive
                          ? "bg-theme-primary-dark text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
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
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                        item.active
                          ? "bg-theme-primary-dark text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
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
