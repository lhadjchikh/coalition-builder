import React from "react";
import { Campaign, HomePage } from "../utils/homepage-data";

interface NavbarProps {
  organizationName?: string;
  navItems?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    active?: boolean;
  }>;
}

interface HomePageLayoutProps {
  homepage: HomePage;
  campaigns: Campaign[];
  homepageError?: string | null;
  campaignsError?: string | null;
  onCampaignSelect?: (campaign: Campaign) => void;
  HeroComponent?: React.ComponentType<{ homepage: HomePage }>;
  ContentBlockComponent?: React.ComponentType<{ block: any }>;
  SocialLinksComponent?: React.ComponentType<{ homepage: HomePage }>;
  NavbarComponent?: React.ComponentType<NavbarProps>;
}

const HomePageLayout: React.FC<HomePageLayoutProps> = ({
  homepage,
  campaigns,
  homepageError,
  campaignsError,
  onCampaignSelect,
  HeroComponent,
  ContentBlockComponent,
  SocialLinksComponent,
  NavbarComponent,
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {NavbarComponent && (
        <NavbarComponent organizationName={homepage.organization_name} />
      )}

      <main role="main">
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
          <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                  {homepage.hero_title}
                </h1>
                {homepage.hero_subtitle && (
                  <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
                    {homepage.hero_subtitle}
                  </p>
                )}
                {homepage.cta_button_url && homepage.cta_button_text && (
                  <div className="mt-10">
                    <a
                      href={homepage.cta_button_url}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                      {homepage.cta_button_text}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        {homepage.about_section_content && (
          <section id="about-section" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {homepage.about_section_title}
                </h2>
                <div className="mt-6 text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: homepage.about_section_content,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Content Blocks */}
        {homepage.content_blocks &&
          homepage.content_blocks.length > 0 &&
          ContentBlockComponent && (
            <>
              {homepage.content_blocks
                .filter((block) => block.is_visible)
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <ContentBlockComponent key={block.id} block={block} />
                ))}
            </>
          )}

        {/* Campaigns Section */}
        {homepage.show_campaigns_section && (
          <section id="campaigns-section" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {homepage.campaigns_section_title}
                </h2>
                {homepage.campaigns_section_subtitle && (
                  <p className="mt-4 text-xl text-gray-600">
                    {homepage.campaigns_section_subtitle}
                  </p>
                )}
              </div>

              <div className="mt-12">
                {campaignsError && !campaigns.length ? (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p>Unable to load campaigns at this time.</p>
                    {process.env.NODE_ENV === "development" && (
                      <p className="text-sm mt-1">{campaignsError}</p>
                    )}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center text-gray-600">
                    <p>No campaigns are currently available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {campaign.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{campaign.summary}</p>
                        {onCampaignSelect ? (
                          <button
                            onClick={() => onCampaignSelect(campaign)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Learn more →
                          </button>
                        ) : (
                          <a
                            href={`/campaigns/${campaign.name}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Learn more →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action Section */}
        {homepage.cta_content && (
          <section className="py-16 bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                {homepage.cta_title}
              </h2>
              <p className="mt-4 text-xl text-blue-100">
                {homepage.cta_content}
              </p>
              {homepage.cta_button_url && homepage.cta_button_text && (
                <div className="mt-8">
                  <a
                    href={homepage.cta_button_url}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    {homepage.cta_button_text}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">
              {homepage.organization_name}
            </h3>
            <p className="text-gray-300 mb-6">{homepage.tagline}</p>

            {/* Contact Information */}
            <div className="mb-6">
              <p className="text-gray-300">
                <a
                  href={`mailto:${homepage.contact_email}`}
                  className="hover:text-white transition-colors"
                >
                  {homepage.contact_email}
                </a>
                {homepage.contact_phone && (
                  <>
                    {" • "}
                    <a
                      href={`tel:${homepage.contact_phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {homepage.contact_phone}
                    </a>
                  </>
                )}
              </p>
            </div>

            {/* Social Links */}
            {SocialLinksComponent && (
              <SocialLinksComponent homepage={homepage} />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageLayout;
