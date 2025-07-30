"use client";

import React from "react";
import { HomePage, Campaign, ContentBlock } from "../types/api";
import { NavItemData } from "../types";
import PageLayout from "./PageLayout";
import ContentBlocksList from "./ContentBlocksList";
import Button from "./Button";
import CampaignsList from "./CampaignsList";

interface NavbarProps {
  organizationName?: string;
  navItems?: NavItemData[];
}

interface FooterProps {
  orgInfo?: HomePage;
}

interface CampaignsPageProps {
  homepage: HomePage;
  campaigns: Campaign[];
  contentBlocks: ContentBlock[];
  campaignsError?: string | null;
  contentError?: string | null;
  onCampaignSelect?: (campaign: Campaign) => void;
  ContentBlockComponent: React.ComponentType<{ block: ContentBlock }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  FooterComponent?: React.ComponentType<FooterProps>;
  navItems?: NavItemData[];
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({
  homepage,
  campaigns,
  contentBlocks,
  campaignsError,
  contentError,
  onCampaignSelect,
  ContentBlockComponent,
  NavbarComponent,
  FooterComponent,
  navItems,
}) => {
  return (
    <PageLayout
      orgInfo={homepage}
      title={homepage.campaigns_section_title || "Policy Campaigns"}
      subtitle={homepage.campaigns_section_subtitle}
      error={contentError}
      NavbarComponent={NavbarComponent}
      FooterComponent={FooterComponent}
      navItems={navItems}
    >
      {/* Content Blocks First */}
      {contentBlocks.length > 0 && (
        <ContentBlocksList
          contentBlocks={contentBlocks}
          pageType="campaigns"
          ContentBlockComponent={ContentBlockComponent}
        />
      )}

      {/* Campaigns Section */}
      <section className="mt-12">
        <CampaignsList
          campaigns={campaigns}
          onCampaignSelect={
            onCampaignSelect ||
            ((campaign) =>
              (window.location.href = `/campaigns/${campaign.name}`))
          }
          error={campaignsError}
        />
      </section>
    </PageLayout>
  );
};

export default CampaignsPage;
