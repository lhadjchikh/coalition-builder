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

const LinkWrapperComponent = LinkWrapper as any;
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
      try {
        const [homepageData, campaignsData, contentBlocksData] = await Promise.all([
          API.getHomepage(),
          API.getCampaigns(),
          API.getContentBlocks('homepage'),
        ]);
        setHomepage(homepageData);
        setCampaigns(campaignsData);
        setContentBlocks(contentBlocksData);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        if (err instanceof Error) {
          setHomepageError(err.message);
          setCampaignsError(err.message);
        } else {
          setHomepageError('Failed to fetch data');
          setCampaignsError('Failed to fetch data');
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
          <Navbar
            {...props}
            LinkComponent={LinkWrapperComponent as any}
            useLocation={useLocation}
          />
        )}
        navItems={DEFAULT_NAV_ITEMS}
        contentBlocks={contentBlocks}
      />
      <Footer homepage={homepage} LinkComponent={LinkWrapperComponent as any} />
    </div>
  );
};

export default Home;
