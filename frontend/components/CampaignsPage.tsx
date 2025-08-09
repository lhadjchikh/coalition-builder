"use client";

import React from "react";
import { HomePage, Campaign, ContentBlock } from "../types/api";
import { NavItemData } from "../types";
import ContentBlocksList from "./ContentBlocksList";
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {NavbarComponent && (
        <NavbarComponent
          organizationName={homepage.organization_name}
          navItems={navItems}
        />
      )}

      <main role="main">
        {/* Page Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto container-padding py-8">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              {homepage.campaigns_section_title || "Policy Campaigns"}
            </h1>
            {homepage.campaigns_section_subtitle && (
              <p className="mt-4 text-xl text-gray-600 max-w-4xl">
                {homepage.campaigns_section_subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {contentError && (
          <div className="max-w-7xl mx-auto container-padding py-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
              <p>Unable to load campaigns at this time.</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-sm mt-1">{contentError}</p>
              )}
            </div>
          </div>
        )}

        {/* Content Blocks First */}
        {contentBlocks.length > 0 && (
          <ContentBlocksList
            contentBlocks={contentBlocks}
            pageType="campaigns"
            ContentBlockComponent={ContentBlockComponent}
          />
        )}

        {/* Campaigns Section */}
        <section className="section-spacing bg-gray-50">
          <div className="max-w-7xl mx-auto container-padding">
            <CampaignsList
              campaigns={campaigns}
              onCampaignSelect={
                onCampaignSelect ||
                ((campaign) =>
                  (window.location.href = `/campaigns/${campaign.name}`))
              }
              error={campaignsError}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      {FooterComponent && <FooterComponent orgInfo={homepage} />}
    </div>
  );
};

export default CampaignsPage;
