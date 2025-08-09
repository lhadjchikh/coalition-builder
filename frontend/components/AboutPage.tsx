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

interface AboutPageProps {
  orgInfo: HomePage;
  contentBlocks: ContentBlock[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const AboutPage: React.FC<AboutPageProps> = ({
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
      title="About Us"
      error={error}
      NavbarComponent={NavbarComponent}
      FooterComponent={FooterComponent}
      navItems={navItems}
    >
      {contentBlocks.length > 0 && (
        <ContentBlocksList
          contentBlocks={contentBlocks}
          pageType="about"
          ContentBlockComponent={ContentBlockComponent}
        />
      )}
    </PageLayout>
  );
};

export default AboutPage;
