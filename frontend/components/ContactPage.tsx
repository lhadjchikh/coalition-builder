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

interface ContactPageProps {
  orgInfo: HomePage;
  contentBlocks: ContentBlock[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const ContactPage: React.FC<ContactPageProps> = ({
  orgInfo,
  contentBlocks,
  error,
  ContentBlockComponent,
  NavbarComponent,
  FooterComponent,
  navItems,
}) => {
  return (
    <PageLayout
      orgInfo={orgInfo}
      title="Contact Us"
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
    </PageLayout>
  );
};

export default ContactPage;
