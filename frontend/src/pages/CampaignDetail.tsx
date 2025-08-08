import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Campaign, HomePage } from '@app-types/index';
import CampaignDetailComponent from '@shared/components/CampaignDetail';
import EndorsementForm from '@components/EndorsementForm';
import EndorsementsList from '@components/EndorsementsList';
import GrowthIcon from '@components/GrowthIcon';
import SocialShareButtons from '@components/SocialShareButtonsWrapper';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { useLocation } from 'react-router-dom';
import LinkWrapper from '@components/LinkWrapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faTimes } from '@fortawesome/free-solid-svg-icons';

const LinkWrapperComponent = LinkWrapper as any;
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '@services/api';
import analytics from '@shared/services/analytics';

const CampaignDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [homepage, setHomepage] = useState<HomePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFloatingShare, setShowFloatingShare] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!name) {
        setError('Campaign name is required');
        setLoading(false);
        return;
      }

      try {
        const [campaignData, homepageData] = await Promise.all([
          API.getCampaignByName(name),
          API.getHomepage(),
        ]);
        setCampaign(campaignData);
        setHomepage(homepageData);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {homepage && (
          <Navbar
            organizationName={homepage.organization_name}
            logoUrl={homepage.theme?.logo_url}
            logoAltText={homepage.theme?.logo_alt_text}
            navItems={DEFAULT_NAV_ITEMS}
            LinkComponent={LinkWrapperComponent as any}
            useLocation={useLocation}
          />
        )}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-white">
        {homepage && (
          <Navbar
            organizationName={homepage.organization_name}
            logoUrl={homepage.theme?.logo_url}
            logoAltText={homepage.theme?.logo_alt_text}
            navItems={DEFAULT_NAV_ITEMS}
            LinkComponent={LinkWrapperComponent as any}
            useLocation={useLocation}
          />
        )}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Campaign not found'}
            </h1>
            <p className="text-gray-600">
              The campaign you're looking for doesn't exist or couldn't be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {homepage && (
        <Navbar
          organizationName={homepage.organization_name}
          logoUrl={homepage.theme?.logo_url}
          logoAltText={homepage.theme?.logo_alt_text}
          navItems={DEFAULT_NAV_ITEMS}
          LinkComponent={LinkWrapperComponent as any}
          useLocation={useLocation}
        />
      )}
      <div className="campaign-detail">
        <CampaignDetailComponent
          campaignId={campaign.id}
          initialCampaign={campaign}
          apiClient={{
            getCampaignById: API.getCampaignById,
            getCampaignByName: API.getCampaignByName,
          }}
          analytics={analytics}
          EndorsementFormComponent={EndorsementForm}
          EndorsementsListComponent={EndorsementsList}
          GrowthIconComponent={GrowthIcon}
          className=""
        />

        {/* Social Share Section */}
        <div className="cta-card cta-card--share">
          <h3 className="cta-heading">Help Spread the Word</h3>
          <p className="cta-text cta-text--compact">
            Share this campaign with your network to build support and momentum.
          </p>
          <SocialShareButtons
            url={`${window.location.origin}/campaigns/${campaign.name}`}
            title={campaign.title}
            description={campaign.summary || campaign.description}
            hashtags={['PolicyChange', 'CivicEngagement', campaign.name?.replace(/-/g, '') || '']}
            campaignName={campaign.name}
            showLabel={false}
          />
        </div>
      </div>

      {/* Floating Share Button for Mobile */}
      <div className="md:hidden">
        {showFloatingShare ? (
          <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs text-center">
            <button
              onClick={() => setShowFloatingShare(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close share menu"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
            <SocialShareButtons
              url={`${window.location.origin}/campaigns/${campaign.name}`}
              title={campaign.title}
              description={campaign.summary || campaign.description}
              hashtags={['PolicyChange', 'CivicEngagement', campaign.name?.replace(/-/g, '') || '']}
              campaignName={campaign.name}
              showLabel={true}
              className="compact"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowFloatingShare(true)}
            className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Share this campaign"
          >
            <FontAwesomeIcon icon={faShare} className="w-6 h-6" />
          </button>
        )}
      </div>

      {homepage && <Footer orgInfo={homepage} LinkComponent={LinkWrapperComponent as any} />}
    </div>
  );
};

export default CampaignDetail;
