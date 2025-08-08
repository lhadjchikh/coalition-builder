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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8 justify-items-center lg:justify-items-start">
          {/* Organization Info Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            {/* Logo or Organization Name */}
            <div className="flex flex-col items-center lg:items-start mb-4">
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
                    className="h-8 sm:h-10 lg:h-12 w-auto max-w-full object-contain"
                  />
                </LinkComponent>
              ) : (
                <LinkComponent
                  to="/"
                  className="text-2xl font-bold text-white hover:text-gray-200 transition-colors duration-200 no-underline"
                >
                  {orgInfo.organization_name}
                </LinkComponent>
              )}
            </div>

            {/* Social Links - Larger Icons */}
            {showSocialLinks && (
              <div className="mb-6 text-center lg:text-left">
                <h4 className="text-white font-semibold mb-4">Follow Us</h4>
                <SocialLinks
                  orgInfo={orgInfo}
                  className="flex gap-4 justify-center lg:justify-start"
                  iconSize="2xl" // Make social icons larger
                />
              </div>
            )}
          </div>

          {/* Site Navigation Column */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-center lg:text-left">
              Site Navigation
            </h4>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                <li>
                  <LinkComponent
                    to="/"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                  >
                    Home
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/campaigns"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                  >
                    Campaigns
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/about"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                  >
                    About
                  </LinkComponent>
                </li>
                <li>
                  <LinkComponent
                    to="/contact"
                    className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                  >
                    Contact
                  </LinkComponent>
                </li>
              </ul>
            </nav>
          </div>

          {/* Support & Legal Column */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-center lg:text-left">
              Support & Legal
            </h4>
            {showLegalLinks && (
              <nav aria-label="Legal links">
                <ul className="space-y-2">
                  <li>
                    <LinkComponent
                      to="/terms"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                    >
                      Terms of Use
                    </LinkComponent>
                  </li>
                  <li>
                    <LinkComponent
                      to="/privacy"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
                    >
                      Privacy Policy
                    </LinkComponent>
                  </li>
                  <li>
                    <LinkComponent
                      to="/admin/"
                      className="text-gray-400 hover:text-white transition-colors duration-200 hover:underline"
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
            <p className="text-gray-400 text-sm text-center md:text-left">
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
