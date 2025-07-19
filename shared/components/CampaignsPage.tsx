import React from "react";
import { HomePage, Campaign, ContentBlock } from "../types/api";
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
        {campaigns.length === 0 ? (
          campaignsError ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-8">
              <p>Unable to load campaigns at this time.</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-sm mt-1">{campaignsError}</p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-12">
              <p>No campaigns are currently available.</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {campaign.image_url && (
                  <img
                    src={campaign.image_url}
                    alt={campaign.image_alt_text || campaign.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{campaign.summary}</p>
                  {onCampaignSelect ? (
                    <button
                      onClick={() => onCampaignSelect(campaign)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    >
                      Learn More
                    </button>
                  ) : (
                    <a
                      href={`/campaigns/${campaign.name}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    >
                      Learn More
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default CampaignsPage;
