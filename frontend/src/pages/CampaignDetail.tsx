import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Campaign, HomePage } from '../types';
import CampaignDetailComponent from '../components/CampaignDetail';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '../services/api';

const CampaignDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [homepage, setHomepage] = useState<HomePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          API.getHomepage()
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
            navItems={DEFAULT_NAV_ITEMS}
            LinkComponent={Link}
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
            navItems={DEFAULT_NAV_ITEMS}
            LinkComponent={Link}
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
          currentView="detail"
          onNavigate={() => {}}
          organizationName={homepage.organization_name}
          navItems={DEFAULT_NAV_ITEMS}
        />
      )}
      <CampaignDetailComponent campaignId={campaign.id} />
      {homepage && <Footer homepage={homepage} />}
    </div>
  );
};

export default CampaignDetail;