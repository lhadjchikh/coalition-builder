import React from "react";
import { HomePage, NavItemData } from "../types";

interface NavbarProps {
  organizationName?: string;
  logoUrl?: string;
  logoAltText?: string;
  navItems?: NavItemData[];
}

interface FooterProps {
  orgInfo?: HomePage;
}

interface PageLayoutProps {
  orgInfo: HomePage;
  title: string;
  subtitle?: string;
  error?: string | null;
  children: React.ReactNode;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const PageLayout: React.FC<PageLayoutProps> = ({
  orgInfo,
  title,
  subtitle,
  error,
  children,
  NavbarComponent,
  FooterComponent,
  navItems,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {NavbarComponent && (
        <NavbarComponent
          organizationName={orgInfo.organization_name}
          logoUrl={orgInfo.theme?.logo_url}
          logoAltText={orgInfo.theme?.logo_alt_text}
          navItems={navItems}
        />
      )}

      <main role="main">
        {/* Page Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto container-padding py-8">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 text-xl text-gray-600 max-w-4xl">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto container-padding py-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
              <p>
                Unable to load {title ? title.toLowerCase() : "content"} at this
                time.
              </p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-sm mt-1">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Allow full-width sections */}
        {children}
      </main>

      {/* Footer */}
      {FooterComponent && <FooterComponent orgInfo={orgInfo} />}
    </div>
  );
};

export default PageLayout;
