import React, { useState, useEffect } from 'react';
import { HomePage, Campaign } from '../types';
import { ContentBlock } from '../services/api';
import CampaignsPage from '@shared/components/CampaignsPage';
import ContentBlockComponent from '@shared/components/ContentBlock';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const Campaigns: React.FC = () => {
  const [homepage, setHomepage] = useState<HomePage | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homepageData, campaignsData, contentBlocksData] = await Promise.all([
          API.getHomepage(),
          API.getCampaigns(),
          API.getContentBlocks('campaigns'),
        ]);
        setHomepage(homepageData);
        setCampaigns(campaignsData);
        setContentBlocks(contentBlocksData);
      } catch (err) {
        console.error('Error fetching campaigns page data:', err);
        if (err instanceof Error) {
          setCampaignsError(err.message);
          setContentError(err.message);
        } else {
          setCampaignsError('Failed to fetch data');
          setContentError('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCampaignSelect = (campaign: Campaign) => {
    // Navigate to campaign detail page
    navigate(`/campaigns/${campaign.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!homepage) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load page</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CampaignsPage
        homepage={homepage}
        campaigns={campaigns}
        contentBlocks={contentBlocks}
        campaignsError={campaignsError}
        contentError={contentError}
        onCampaignSelect={handleCampaignSelect}
        ContentBlockComponent={ContentBlockComponent}
        NavbarComponent={(props: any) => (
          <Navbar {...props} LinkComponent={Link} useLocation={useLocation} />
        )}
        FooterComponent={(props: any) => <Footer {...props} LinkComponent={Link} />}
        navItems={DEFAULT_NAV_ITEMS}
      />
    </div>
  );
};

export default Campaigns;
