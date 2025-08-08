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
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white mb-4">
            {orgInfo.organization_name}
          </h3>

          {orgInfo.tagline && (
            <p className="text-lg text-gray-300 mb-8">{orgInfo.tagline}</p>
          )}

          {/* Social Links */}
          {showSocialLinks && (
            <div className="mb-6">
              <SocialLinks
                orgInfo={orgInfo}
                className="flex justify-center gap-6"
              />
            </div>
          )}

          {/* Legal Links */}
          {showLegalLinks && (
            <nav className="mb-6" aria-label="Legal links">
              <div className="flex justify-center gap-6">
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
                <span className="text-gray-600">•</span>
                <LinkComponent
                  to="/admin/"
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  Admin Login
                </LinkComponent>
              </div>
            </nav>
          )}

          {/* Copyright */}
          <div className="pt-8 mt-8 border-t border-gray-800">
            <p className="text-gray-400 text-base">
              © {currentYear} {orgInfo.organization_name}. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Powered by{" "}
              <a
                href="https://github.com/lhadjchikh/coalition-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 underline transition-colors duration-200"
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
