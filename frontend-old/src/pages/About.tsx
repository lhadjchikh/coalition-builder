import React, { useState, useEffect } from 'react';
import { HomePage } from '@app-types/index';
import { ContentBlock } from '@services/api';
import AboutPage from '@shared/components/AboutPage';
import ContentBlockComponent from '@shared/components/ContentBlock';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { Link, useLocation } from 'react-router-dom';
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '@services/api';

const About: React.FC = () => {
  const [homepage, setHomepage] = useState<HomePage | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homepageData, contentBlocksData] = await Promise.all([
          API.getHomepage(),
          API.getContentBlocksByPageType('about'),
        ]);
        setHomepage(homepageData);
        setContentBlocks(contentBlocksData);
      } catch (err) {
        console.error('Error fetching about page data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <AboutPage
        orgInfo={homepage}
        contentBlocks={contentBlocks}
        error={error}
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

export default About;
