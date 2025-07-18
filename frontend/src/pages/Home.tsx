import React, { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { HomePage as HomePageType, ContentBlock } from '@shared/types/api';
import HomePage from '@shared/components/HomePage';
import HeroSection from '@shared/components/HeroSection';
import ContentBlockComponent from '@shared/components/ContentBlock';
import SocialLinks from '@shared/components/SocialLinks';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { getFallbackHomepage } from '@shared/utils/homepage-data';

const LinkWrapper: React.FC<{
  to?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ to, href, children, className, onClick }) => (
  <Link to={to || href || '/'} className={className} onClick={onClick}>
    {children}
  </Link>
);
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [homepage, setHomepage] = useState<HomePageType | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [homepageError, setHomepageError] = useState<string | null>(null);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // Use Promise.allSettled to handle partial failures gracefully
      const [homepageResult, campaignsResult, contentBlocksResult] = await Promise.allSettled([
        API.getHomepage(),
        API.getCampaigns(),
        API.getContentBlocksByPageType('homepage'),
      ]);

      // Handle homepage result
      if (homepageResult.status === 'fulfilled') {
        setHomepage(homepageResult.value);
      } else {
        console.error('Error fetching homepage:', homepageResult.reason);
        setHomepageError(
          homepageResult.reason instanceof Error
            ? homepageResult.reason.message
            : 'Failed to fetch homepage'
        );
        // Use fallback homepage data
        setHomepage(getFallbackHomepage());
      }

      // Handle campaigns result
      if (campaignsResult.status === 'fulfilled') {
        setCampaigns(campaignsResult.value);
      } else {
        console.error('Error fetching campaigns:', campaignsResult.reason);
        setCampaignsError(
          campaignsResult.reason instanceof Error
            ? campaignsResult.reason.message
            : 'Failed to fetch campaigns'
        );
      }

      // Handle content blocks result
      if (contentBlocksResult.status === 'fulfilled') {
        setContentBlocks(contentBlocksResult.value);
      } else {
        console.error('Error fetching content blocks:', contentBlocksResult.reason);
      }

      setLoading(false);
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
      <HomePage
        homepage={homepage}
        campaigns={campaigns}
        homepageError={homepageError}
        campaignsError={campaignsError}
        onCampaignSelect={handleCampaignSelect}
        HeroComponent={HeroSection}
        ContentBlockComponent={ContentBlockComponent}
        SocialLinksComponent={SocialLinks}
        NavbarComponent={(props: any) => (
          <Navbar {...props} LinkComponent={LinkWrapper} useLocation={useLocation} />
        )}
        navItems={DEFAULT_NAV_ITEMS}
        contentBlocks={contentBlocks}
      />
      <Footer orgInfo={homepage} LinkComponent={LinkWrapper} />
    </div>
  );
};

export default Home;
