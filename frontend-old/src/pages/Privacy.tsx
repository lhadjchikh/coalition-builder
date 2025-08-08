import React, { useEffect, useState } from 'react';
import { LegalDocumentResponse, HomePage } from '@shared/types';
import Navbar from '@shared/components/Navbar';
import Footer from '@shared/components/Footer';
import { useLocation } from 'react-router-dom';
import { DEFAULT_NAV_ITEMS } from '@shared/types';
import API from '@services/api';
import LinkWrapper from '@components/LinkWrapper';

const Privacy: React.FC = () => {
  const [document, setDocument] = useState<LegalDocumentResponse | null>(null);
  const [homepage, setHomepage] = useState<HomePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [privacyData, homepageData] = await Promise.all([
          API.getPrivacyPolicy(),
          API.getHomepage(),
        ]);
        setDocument(privacyData);
        setHomepage(homepageData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load Privacy Policy. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {homepage && (
        <Navbar
          organizationName={homepage.organization_name}
          logoUrl={homepage.theme?.logo_url}
          logoAltText={homepage.theme?.logo_alt_text}
          navItems={DEFAULT_NAV_ITEMS}
          LinkComponent={LinkWrapper}
          useLocation={useLocation}
        />
      )}
      <main role="main" className="pb-16">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
              <p className="mt-4 text-theme-text-muted">Loading Privacy Policy...</p>
            </div>
          )}

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          {document && !loading && !error && (
            <article className="prose prose-lg max-w-none">
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{ __html: document.content }}
              />
            </article>
          )}
        </div>
      </main>
      {homepage && <Footer orgInfo={homepage} LinkComponent={LinkWrapper} />}
    </div>
  );
};

export default Privacy;
