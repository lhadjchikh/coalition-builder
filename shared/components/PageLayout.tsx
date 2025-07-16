import React from "react";
import { HomePage, NavItemData } from "../types";

interface NavbarProps {
  organizationName?: string;
  navItems?: NavItemData[];
}

interface FooterProps {
  homepage?: HomePage;
}

interface PageLayoutProps {
  homepage: HomePage;
  title: string;
  subtitle?: string;
  error?: string | null;
  children: React.ReactNode;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const PageLayout: React.FC<PageLayoutProps> = ({
  homepage,
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
          organizationName={homepage.organization_name}
          navItems={navItems}
        />
      )}

      <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-4 text-xl text-gray-600">{subtitle}</p>}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
            <p>Unable to load content at this time.</p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-sm mt-1">{error}</p>
            )}
          </div>
        )}

        {/* Main Content */}
        {children}
      </main>

      {/* Footer */}
      {FooterComponent && <FooterComponent homepage={homepage} />}
    </div>
  );
};

export default PageLayout;
