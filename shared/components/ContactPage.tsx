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
  orgInfo?: HomePage;
}

interface SocialLinksProps {
  orgInfo: HomePage;
}

interface ContactPageProps {
  orgInfo: HomePage;
  contentBlocks: ContentBlock[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  SocialLinksComponent?: React.ComponentType<SocialLinksProps>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const ContactPage: React.FC<ContactPageProps> = ({
  orgInfo,
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
      orgInfo={orgInfo}
      title="Contact Us"
      subtitle={`Get in touch with ${orgInfo.organization_name}`}
      error={error}
      NavbarComponent={NavbarComponent}
      FooterComponent={FooterComponent}
      navItems={navItems}
    >
      {/* Content Blocks First */}
      {contentBlocks.length > 0 && (
        <ContentBlocksList
          contentBlocks={contentBlocks}
          pageType="contact"
          ContentBlockComponent={ContentBlockComponent}
        />
      )}

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
                {orgInfo.organization_name}
              </h3>
              <p className="text-gray-600 mb-4">{orgInfo.tagline}</p>
            </div>

            {/* Social Links */}
            {SocialLinksComponent && (
              <div className="py-4">
                <SocialLinksComponent orgInfo={orgInfo} />
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
