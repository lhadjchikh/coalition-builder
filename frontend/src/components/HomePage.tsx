import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Campaign, HomePage as HomePageType } from '../types';
import HeroSection from './HeroSection';
import ContentBlock from './ContentBlock';
import SocialLinks from './SocialLinks';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ThemeStyles } from './ThemeStyles';

interface HomePageProps {
  onCampaignSelect?: (campaign: Campaign) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onCampaignSelect }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [homepage, setHomepage] = useState<HomePageType | null>(null);
  const [homepageError, setHomepageError] = useState<string | null>(null);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Fetch homepage and campaigns in parallel for better performance
      const [homepageResult, campaignsResult] = await Promise.allSettled([
        API.getHomepage(),
        API.getCampaigns(),
      ]);

      if (!isMounted) return;

      // Handle homepage result
      if (homepageResult.status === 'fulfilled') {
        setHomepage(homepageResult.value);
      } else {
        const errorMessage =
          homepageResult.reason instanceof Error
            ? homepageResult.reason.message
            : 'Failed to fetch homepage';
        setHomepageError(errorMessage);
        console.error('Error fetching homepage:', homepageResult.reason);
      }

      // Handle campaigns result
      if (campaignsResult.status === 'fulfilled') {
        setCampaigns(campaignsResult.value);
      } else {
        const errorMessage =
          campaignsResult.reason instanceof Error
            ? campaignsResult.reason.message
            : 'Failed to fetch campaigns';
        setCampaignsError(errorMessage);
        console.error('Error fetching campaigns:', campaignsResult.reason);
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback homepage data if API fails
  const fallbackHomepage: HomePageType = {
    id: 0,
    organization_name: process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Coalition Builder',
    tagline: process.env.NEXT_PUBLIC_TAGLINE || 'Building strong advocacy partnerships',
    hero_title: 'Welcome to Coalition Builder',
    hero_subtitle: 'Empowering advocates to build strong policy coalitions',
    hero_background_image: '',
    about_section_title: 'About Our Mission',
    about_section_content:
      'We believe in the power of collective action to drive meaningful policy change.',
    cta_title: 'Get Involved',
    cta_content: 'Join our coalition and help make a difference.',
    cta_button_text: 'Learn More',
    cta_button_url: '',
    contact_email: 'info@example.org',
    contact_phone: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    campaigns_section_title: 'Policy Campaigns',
    campaigns_section_subtitle: '',
    show_campaigns_section: true,
    content_blocks: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const currentHomepage = homepage || fallbackHomepage;

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-primary mx-auto"></div>
          <p className="mt-4 text-theme-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider initialTheme={currentHomepage.theme}>
      <ThemeStyles theme={currentHomepage.theme} />
      <main className="min-h-screen bg-theme-bg" role="main">
        {/* Development notice when using fallback data */}
        {process.env.NODE_ENV === 'development' && homepageError && (
          <div className="bg-theme-primary/10 border-l-4 border-theme-primary text-theme-primary p-4">
            <p className="font-bold">Development Notice</p>
            <p className="text-sm">
              Using fallback homepage data due to API error: {homepageError}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <HeroSection homepage={currentHomepage} />

        {/* About Section */}
        {currentHomepage.about_section_content && (
          <section className="py-16 bg-theme-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-theme-heading font-theme-heading sm:text-4xl">
                  {currentHomepage.about_section_title}
                </h2>
                <div className="mt-6 text-xl text-theme-body font-theme-body max-w-4xl mx-auto leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentHomepage.about_section_content,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Content Blocks */}
        {currentHomepage.content_blocks && currentHomepage.content_blocks.length > 0 && (
          <>
            {currentHomepage.content_blocks
              .filter(block => block.is_visible)
              .sort((a, b) => a.order - b.order)
              .map(block => (
                <ContentBlock key={block.id} block={block} />
              ))}
          </>
        )}

        {/* Campaigns Section */}
        {currentHomepage.show_campaigns_section && (
          <section className="py-16 bg-theme-bg-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-theme-heading font-theme-heading sm:text-4xl">
                  {currentHomepage.campaigns_section_title}
                </h2>
                {currentHomepage.campaigns_section_subtitle && (
                  <p className="mt-4 text-xl text-theme-body font-theme-body">
                    {currentHomepage.campaigns_section_subtitle}
                  </p>
                )}
              </div>

              <div className="mt-12">
                {campaignsError && !campaigns.length ? (
                  <div className="bg-theme-accent/10 border border-theme-accent text-theme-accent px-4 py-3 rounded">
                    <p>Unable to load campaigns at this time.</p>
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-sm mt-1">{campaignsError}</p>
                    )}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center text-theme-muted">
                    <p>No campaigns are currently available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map(campaign => (
                      <div
                        key={campaign.id}
                        data-testid={`homepage-campaign-${campaign.id}`}
                        className="bg-theme-bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-theme-secondary/20"
                      >
                        <h3 className="text-lg font-semibold text-theme-heading font-theme-heading mb-2">
                          {campaign.title}
                        </h3>
                        <p className="text-theme-body font-theme-body mb-4">{campaign.summary}</p>
                        {onCampaignSelect ? (
                          <button
                            onClick={() => onCampaignSelect(campaign)}
                            className="text-theme-text-link hover:text-theme-text-link-hover font-medium transition-colors"
                          >
                            Learn more →
                          </button>
                        ) : (
                          <a
                            href={`/campaigns/${campaign.name}`}
                            className="text-theme-text-link hover:text-theme-text-link-hover font-medium transition-colors"
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
        {currentHomepage.cta_content && (
          <section className="py-16 bg-theme-primary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-white font-theme-heading sm:text-4xl">
                {currentHomepage.cta_title}
              </h2>
              <p className="mt-4 text-xl text-white/90 font-theme-body">
                {currentHomepage.cta_content}
              </p>
              {currentHomepage.cta_button_url && currentHomepage.cta_button_text && (
                <div className="mt-8">
                  <a
                    href={currentHomepage.cta_button_url}
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-theme-primary bg-white hover:bg-theme-bg-section transition-colors duration-200"
                  >
                    {currentHomepage.cta_button_text}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-theme-secondary">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white font-theme-heading mb-4">
                {currentHomepage.organization_name}
              </h3>
              <p className="text-white/70 font-theme-body mb-6">{currentHomepage.tagline}</p>

              {/* Contact Information */}
              <div className="mb-6">
                <p className="text-white/70 font-theme-body">
                  <a
                    href={`mailto:${currentHomepage.contact_email}`}
                    className="hover:text-white transition-colors"
                  >
                    {currentHomepage.contact_email}
                  </a>
                  {currentHomepage.contact_phone && (
                    <>
                      {' • '}
                      <a
                        href={`tel:${currentHomepage.contact_phone}`}
                        className="hover:text-white transition-colors"
                      >
                        {currentHomepage.contact_phone}
                      </a>
                    </>
                  )}
                </p>
              </div>

              {/* Social Links */}
              <SocialLinks homepage={currentHomepage} />
            </div>
          </div>
        </footer>
      </main>
    </ThemeProvider>
  );
};

export default HomePage;
