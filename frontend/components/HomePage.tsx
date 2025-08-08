"use client";

import React from "react";
import type { Campaign, HomePage, ContentBlock } from "../types/api";
import type { NavItemData } from "../types";
import Button from "./Button";
import CampaignsList from "./CampaignsList";

interface NavbarProps {
  organizationName?: string;
  logoUrl?: string;
  logoAltText?: string;
  navItems?: NavItemData[];
}

interface HomePageProps {
  homepage: HomePage;
  campaigns: Campaign[];
  homepageError?: string | null;
  campaignsError?: string | null;
  onCampaignSelect?: (campaign: Campaign) => void;
  HeroComponent?: React.ComponentType<{ homepage: HomePage }>;
  ContentBlockComponent?: React.ComponentType<{ block: ContentBlock }>;
  SocialLinksComponent?: React.ComponentType<{ orgInfo: HomePage }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
  navItems?: NavItemData[];
  contentBlocks?: ContentBlock[];
}

const HomePage: React.FC<HomePageProps> = ({
  homepage,
  campaigns,
  homepageError,
  campaignsError,
  onCampaignSelect,
  HeroComponent,
  ContentBlockComponent,
  SocialLinksComponent,
  NavbarComponent,
  navItems,
  contentBlocks = [],
}) => {
  return (
    <>
      {/* Navigation */}
      {NavbarComponent && (
        <NavbarComponent
          organizationName={homepage.organization_name}
          logoUrl={homepage.theme?.logo_url}
          logoAltText={homepage.theme?.logo_alt_text}
          navItems={navItems}
        />
      )}

      <main role="main" className="pt-20">
        {/* Development notice when using fallback data */}
        {process.env.NODE_ENV === "development" && homepageError && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
            <p className="font-bold">Development Notice</p>
            <p className="text-sm">
              Using fallback homepage data due to API error: {homepageError}
            </p>
          </div>
        )}

        {/* Hero Section */}
        {HeroComponent ? (
          <HeroComponent homepage={homepage} />
        ) : (
          <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 section-spacing-lg -mt-20 pt-32">
            <div className="max-w-7xl mx-auto container-padding">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="h1 text-white text-balance">
                  {homepage.hero_title}
                </h1>
                {homepage.hero_subtitle && (
                  <p className="lead text-blue-100 mx-auto text-balance">
                    {homepage.hero_subtitle}
                  </p>
                )}
                {homepage.cta_button_url && homepage.cta_button_text && (
                  <div className="mt-10">
                    <Button
                      href={homepage.cta_button_url}
                      variant="primary"
                      size="lg"
                    >
                      {homepage.cta_button_text}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Content Blocks */}
        {contentBlocks && contentBlocks.length > 0 && ContentBlockComponent && (
          <>
            {contentBlocks
              .filter((block) => block.is_visible)
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <ContentBlockComponent key={block.id} block={block} />
              ))}
          </>
        )}

        {/* Campaigns Section */}
        {homepage.show_campaigns_section && (
          <section
            id="campaigns-section"
            className="section-spacing bg-gray-50"
          >
            <div className="max-w-7xl mx-auto container-padding">
              <div className="text-center max-w-4xl mx-auto mb-12">
                <h2 className="h2 text-theme-heading">
                  {homepage.campaigns_section_title}
                </h2>
                {homepage.campaigns_section_subtitle && (
                  <p className="text-body-lg text-theme-text-muted mt-4">
                    {homepage.campaigns_section_subtitle}
                  </p>
                )}
              </div>

              <div className="mt-12">
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
            </div>
          </section>
        )}

        {/* Call to Action Section */}
        {homepage.cta_content && (
          <section className="section-spacing bg-theme-primary">
            <div className="max-w-7xl mx-auto container-padding text-center">
              <h2 className="h2 text-white text-balance">
                {homepage.cta_title}
              </h2>
              <div
                className="text-body-lg text-white/90 max-w-3xl mx-auto mt-6 text-balance"
                dangerouslySetInnerHTML={{ __html: homepage.cta_content }}
              />
              {homepage.cta_button_url && homepage.cta_button_text && (
                <div className="mt-8">
                  <Button
                    href={homepage.cta_button_url}
                    variant="accent"
                    size="lg"
                  >
                    {homepage.cta_button_text}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default HomePage;
