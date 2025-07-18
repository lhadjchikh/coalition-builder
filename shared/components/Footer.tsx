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
    to?: string;
    href?: string;
    children: React.ReactNode;
    className?: string;
  }>;
}

const Footer: React.FC<FooterProps> = ({
  orgInfo,
  showSocialLinks = true,
  showLegalLinks = true,
  className,
  LinkComponent = ({ href, to, children, className }: any) => (
    <a href={href || to} className={className}>
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
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">
            {orgInfo.organization_name}
          </h3>

          {orgInfo.tagline && (
            <p className="text-gray-300 mb-6">{orgInfo.tagline}</p>
          )}

          {/* Social Links */}
          {showSocialLinks && (
            <div className="mb-6">
              <SocialLinks
                orgInfo={orgInfo}
                className="flex justify-center space-x-6"
              />
            </div>
          )}

          {/* Legal Links */}
          {showLegalLinks && (
            <nav className="mb-6" aria-label="Legal links">
              <div className="flex justify-center space-x-6">
                <LinkComponent
                  to="/terms"
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  Terms of Use
                </LinkComponent>
                <LinkComponent
                  to="/privacy"
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  Privacy Policy
                </LinkComponent>
              </div>
            </nav>
          )}

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              © {currentYear} {orgInfo.organization_name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
