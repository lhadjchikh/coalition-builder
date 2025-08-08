"use client";

import React from "react";
import SocialLinks from "./SocialLinks";
import { HomePage } from "../types";

interface FooterProps {
  orgInfo?: HomePage;
  showSocialLinks?: boolean;
  showLegalLinks?: boolean;
  className?: string;
  LinkComponent?: React.ComponentType<{
    to: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

const Footer: React.FC<FooterProps> = ({
  orgInfo,
  showSocialLinks = true,
  showLegalLinks = true,
  className,
  LinkComponent = ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}) => {
  if (!orgInfo) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className={className || "bg-gray-900"}>
      <div className="max-w-7xl mx-auto section-spacing container-padding">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 justify-items-center lg:justify-items-start items-start">
          {/* Logo and Tagline Column */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center lg:items-start">
              {/* Logo */}
              {orgInfo.theme?.logo_url ? (
                <LinkComponent
                  to="/"
                  className="mb-3 transition-all duration-300 transform hover:scale-105"
                >
                  <img
                    src={orgInfo.theme.logo_url}
                    alt={
                      orgInfo.theme.logo_alt_text ||
                      `${orgInfo.organization_name} logo`
                    }
                    className="h-10 sm:h-12 lg:h-16 w-auto max-w-full object-contain"
                  />
                </LinkComponent>
              ) : (
                <LinkComponent
                  to="/"
                  className="text-2xl font-bold text-white hover:text-gray-200 transition-colors duration-200 no-underline mb-3"
                >
                  {orgInfo.organization_name}
                </LinkComponent>
              )}

              {/* Tagline */}
              {orgInfo.tagline && (
                <p className="text-gray-300 text-sm text-center lg:text-left max-w-xs">
                  {orgInfo.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Social Links Column */}
          <div className="lg:col-span-1">
            {showSocialLinks && (
              <div className="flex flex-col items-center lg:items-start">
                <h4 className="text-white font-semibold mb-4 text-center lg:text-left text-lg leading-none">
                  Follow Us
                </h4>
                <SocialLinks
                  orgInfo={orgInfo}
                  className="flex gap-4 justify-center lg:justify-start"
                  iconSize="xl"
                />
              </div>
            )}
          </div>

          {/* Site Navigation Column */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4 text-center lg:text-left text-base sm:text-lg leading-none">
              Site Navigation
            </h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-center lg:text-left">
                <li>
                  <LinkComponent
                    to="/"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                  >
                    Home
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/campaigns"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                  >
                    Campaigns
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/about"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                  >
                    About
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/contact"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                  >
                    Contact
                  </LinkComponent>
                </li>
              </ul>
            </nav>
          </div>

          {/* Support & Legal Column */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4 text-center lg:text-left text-base sm:text-lg leading-none">
              Support & Legal
            </h4>
            {showLegalLinks && (
              <nav aria-label="Legal links">
                <ul className="space-y-2 text-center lg:text-left">
                  <li>
                    <LinkComponent
                      to="/terms"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                    >
                      Terms of Use
                    </LinkComponent>
                  </li>
                  <li>
                    <LinkComponent
                      to="/privacy"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                    >
                      Privacy Policy
                    </LinkComponent>
                  </li>
                  <li>
                    <LinkComponent
                      to="/admin/"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline text-sm sm:text-base"
                    >
                      Admin Login
                    </LinkComponent>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm sm:text-base text-center md:text-left">
              <span className="copyright-text">
                © {currentYear} {orgInfo.organization_name}.
              </span>{" "}
              <span className="copyright-text">All rights reserved.</span>
            </p>
            <p className="text-gray-500 footer-attribution">
              Powered by{" "}
              <a
                href="https://github.com/lhadjchikh/coalition-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 no-break"
              >
                Coalition Builder
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
