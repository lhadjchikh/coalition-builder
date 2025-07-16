import React from "react";
import { HomePage, ContentBlock } from "../types/api";
import { NavItemData } from "../types";
import PageLayout from "./PageLayout";
import ContentBlocksList from "./ContentBlocksList";

interface NavbarProps {
  organizationName?: string;
  navItems?: NavItemData[];
}

interface FooterProps {
  homepage?: HomePage;
}

interface SocialLinksProps {
  homepage: HomePage;
}

interface ContactPageProps {
  homepage: HomePage;
  contentBlocks: ContentBlock[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  SocialLinksComponent?: React.ComponentType<SocialLinksProps>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const ContactPage: React.FC<ContactPageProps> = ({
  homepage,
  contentBlocks,
  error,
  ContentBlockComponent,
  SocialLinksComponent,
  NavbarComponent,
  FooterComponent,
  navItems,
}) => {
  return (
    <PageLayout
      homepage={homepage}
      title="Contact Us"
      subtitle={`Get in touch with ${homepage.organization_name}`}
      error={error}
      NavbarComponent={NavbarComponent}
      FooterComponent={FooterComponent}
      navItems={navItems}
    >
      {/* Content Blocks First */}
      <ContentBlocksList
        contentBlocks={contentBlocks}
        pageType="contact"
        ContentBlockComponent={ContentBlockComponent}
        emptyMessage="No contact information is currently available."
      />

      {/* Built-in Contact Information Section */}
      <section className="mt-12 bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Connect With Us
          </h2>

          <div className="max-w-md mx-auto space-y-4">
            {/* Organization Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {homepage.organization_name}
              </h3>
              <p className="text-gray-600 mb-4">{homepage.tagline}</p>
            </div>

            {/* Social Links */}
            {SocialLinksComponent && (
              <div className="py-4">
                <SocialLinksComponent homepage={homepage} />
              </div>
            )}

            {/* Additional Contact Instructions */}
            <div className="text-sm text-gray-600 mt-6">
              <p>
                We'd love to hear from you! Connect with us through social media
                or check our content blocks above for additional contact
                information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ContactPage;
