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

interface AboutPageProps {
  homepage: HomePage;
  contentBlocks: ContentBlock[];
  error?: string | null;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const AboutPage: React.FC<AboutPageProps> = ({
  homepage,
  contentBlocks,
  error,
  ContentBlockComponent,
  NavbarComponent,
  FooterComponent,
  navItems,
}) => {
  return (
    <PageLayout
      homepage={homepage}
      title={`About ${homepage.organization_name}`}
      subtitle={homepage.tagline}
      error={error}
      NavbarComponent={NavbarComponent}
      FooterComponent={FooterComponent}
      navItems={navItems}
    >
      <ContentBlocksList
        contentBlocks={contentBlocks}
        pageType="about"
        ContentBlockComponent={ContentBlockComponent}
        emptyMessage="No about content is currently available."
      />
    </PageLayout>
  );
};

export default AboutPage;
