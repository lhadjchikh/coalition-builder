import React from "react";
import { HomePage } from "../utils/homepage-data";
import { NavItemData } from "../types";
import PageLayout from "./PageLayout";
import ContentBlocksList from "./ContentBlocksList";

// Generic content block interface
interface ContentBlock {
  id: string | number;
  title?: string;
  content: string;
  block_type: string;
  image_url?: string;
  image_alt_text?: string;
  css_classes?: string;
  background_color?: string;
}

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