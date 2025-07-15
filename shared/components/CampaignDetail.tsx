import React, { useState, useEffect, useRef } from 'react';

// Generic interfaces that work with both frontend and SSR
interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  image?: string;
  allow_endorsements: boolean;
}

interface CampaignDetailProps {
  campaignId?: number;
  campaignName?: string;
  initialCampaign?: Campaign;
  // Injected dependencies
  apiClient: {
    getCampaignById: (id: number) => Promise<Campaign>;
    getCampaignByName: (name: string) => Promise<Campaign>;
  };
  analytics?: {
    trackCampaignView: (campaignName: string) => void;
  };
  EndorsementFormComponent?: React.ComponentType<{
    campaign: Campaign;
    onEndorsementSubmitted: () => void;
    onFormInteraction: (isActive: boolean) => void;
    ref?: React.RefObject<any>;
  }>;
  EndorsementsListComponent?: React.ComponentType<{
    campaignId: number;
    refreshTrigger: number;
    onCountUpdate: (count: number, recentCount?: number) => void;
  }>;
  GrowthIconComponent?: React.ComponentType<{
    stage: 'seed' | 'seedling' | 'tree';
    size: string;
    color: string;
  }>;
  className?: string;
}

// Configuration constants
const SOCIAL_PROOF_THRESHOLD = 10;
const MOMENTUM_DISPLAY_THRESHOLD = 25;

// Style constants for inline styles
const SECTION_LAYOUT_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2rem',
};

const ICON_CONTAINER_STYLE: React.CSSProperties = {
  width: '4rem',
  height: '4rem',
  color: '#4caf50',
  flexShrink: 0,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const TEXT_CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  textAlign: 'left',
};

const CampaignDetail: React.FC<CampaignDetailProps> = ({
  campaignId,
  campaignName,
  initialCampaign,
  apiClient,
  analytics,
  EndorsementFormComponent,
  EndorsementsListComponent,
  GrowthIconComponent,
  className = "campaign-detail",
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign || null);
  const [loading, setLoading] = useState<boolean>(!initialCampaign);
  const [error, setError] = useState<string | null>(null);
  const [refreshEndorsements, setRefreshEndorsements] = useState<number>(0);
  const [showStickyCard, setShowStickyCard] = useState<boolean>(false);
  const [endorsementCount, setEndorsementCount] = useState<number>(0);
  const [recentEndorsements, setRecentEndorsements] = useState<number>(0);
  const [isFormActive, setIsFormActive] = useState<boolean>(false);
  const endorsementSectionRef = useRef<HTMLElement>(null);
  const endorsementFormRef = useRef<any>(null);

  useEffect(() => {
    // Skip fetching if we already have initial campaign data
    if (initialCampaign) {
      // Track campaign view for initial campaign
      analytics?.trackCampaignView(initialCampaign.name || `Campaign ${initialCampaign.id}`);
      return;
    }

    const fetchCampaign = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let data: Campaign | null;
        if (campaignId) {
          data = await apiClient.getCampaignById(campaignId);
        } else if (campaignName) {
          data = await apiClient.getCampaignByName(campaignName);
        } else {
          throw new Error('Either campaignId or campaignName must be provided');
        }

        setCampaign(data);

        // Track campaign view only if data exists
        if (data) {
          analytics?.trackCampaignView(data.name || `Campaign ${data.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campaign');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId || campaignName) {
      fetchCampaign();
    } else {
      // Handle the case where neither ID nor name is provided
      setLoading(false);
      setError('Either campaignId or campaignName must be provided');
    }
  }, [campaignId, campaignName, initialCampaign, apiClient, analytics]);

  const handleEndorsementSubmitted = () => {
    // Trigger a refresh of the endorsements list
    setRefreshEndorsements(prev => prev + 1);
  };

  const handleEndorsementCountUpdate = (count: number, recentCount?: number) => {
    setEndorsementCount(count);
    if (recentCount !== undefined) {
      setRecentEndorsements(recentCount);
    }
  };

  const scrollToEndorsementForm = () => {
    endorsementFormRef.current?.scrollToFirstField?.();
  };

  const handleFormInteraction = (isActive: boolean) => {
    setIsFormActive(isActive);
  };

  useEffect(() => {
    const SCROLL_THRESHOLD = 200;
    const VIEWPORT_RATIO = 0.8;

    const handleScroll = () => {
      if (endorsementSectionRef.current) {
        const rect = endorsementSectionRef.current.getBoundingClientRect();
        // Show sticky CTA when user has scrolled down and endorsement section is not at the top
        const shouldShow =
          window.scrollY > SCROLL_THRESHOLD && rect.top < window.innerHeight * VIEWPORT_RATIO;
        setShowStickyCard(shouldShow);
      }
    };

    // Call once on mount to set initial state
    handleScroll();

    // Only add scroll listener in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="campaign-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="campaign-error">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading campaign</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="campaign-not-found">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h1>
          <p className="text-gray-600">The campaign you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-testid="campaign-detail">
      {/* Hero Image Section */}
      {campaign.image && (
        <div className="relative">
          <img
            src={campaign.image}
            alt={`Hero image for ${campaign.title}`}
            className="w-full h-96 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
              <p className="text-xl">{campaign.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Endorsement CTA */}
      {campaign.allow_endorsements && showStickyCard && !isFormActive && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-medium">Support this campaign!</span>
            <button
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
              onClick={scrollToEndorsementForm}
              aria-label="Scroll to endorsement form"
            >
              Endorse Now
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          {/* Only show title and summary in header if there's no hero image */}
          {!campaign.image && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
              <p className="text-xl text-gray-600">{campaign.summary}</p>
            </div>
          )}

          {/* Smart Social Proof Section */}
          {campaign.allow_endorsements && endorsementCount >= SOCIAL_PROOF_THRESHOLD && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                {GrowthIconComponent && (
                  <div className="flex-shrink-0">
                    <GrowthIconComponent stage="tree" size="48px" color="#4caf50" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-2xl font-bold text-green-800">
                    {endorsementCount} {endorsementCount === 1 ? 'Endorsement' : 'Endorsements'}
                  </div>
                  <p className="text-green-700">
                    Join {endorsementCount} supporters backing this campaign
                  </p>
                </div>
              </div>
              {recentEndorsements > 0 && endorsementCount >= MOMENTUM_DISPLAY_THRESHOLD && (
                <div className="bg-yellow-100 border border-yellow-200 rounded px-3 py-1 inline-block">
                  <span className="text-yellow-800 text-sm font-medium">
                    ✨ {recentEndorsements} new {recentEndorsements === 1 ? 'endorsement' : 'endorsements'} this week
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Early Supporter Appeal (1-9 endorsements) */}
          {campaign.allow_endorsements &&
            endorsementCount > 0 &&
            endorsementCount < SOCIAL_PROOF_THRESHOLD && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  {GrowthIconComponent && (
                    <div className="flex-shrink-0">
                      <GrowthIconComponent stage="seedling" size="48px" color="#4caf50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Join the Early Supporters</h3>
                    <p className="text-blue-700">Be among the founding voices advocating for this important initiative.</p>
                  </div>
                </div>
              </div>
            )}

          {/* First Endorser Appeal (0 endorsements) */}
          {campaign.allow_endorsements && endorsementCount === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                {GrowthIconComponent && (
                  <div className="flex-shrink-0">
                    <GrowthIconComponent stage="seed" size="48px" color="#4caf50" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Be the First to Show Support</h3>
                  <p className="text-gray-700">Help launch this campaign by adding your voice to this important cause.</p>
                </div>
              </div>
            </div>
          )}

          {/* Prominent CTA in header */}
          {campaign.allow_endorsements && (
            <div className="text-center mb-8">
              <button 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
                onClick={scrollToEndorsementForm}
              >
                {endorsementCount === 0
                  ? 'Be the First to Endorse'
                  : endorsementCount < SOCIAL_PROOF_THRESHOLD
                    ? 'Join the Early Supporters'
                    : 'Add Your Endorsement'}
              </button>
              <p className="text-gray-600 mt-2">
                {endorsementCount === 0 && 'Help launch this important initiative.'}
                {endorsementCount > 0 && endorsementCount < SOCIAL_PROOF_THRESHOLD && 
                  'Join this growing movement in its early stages.'}
              </p>
            </div>
          )}
        </header>

        {campaign.description && (
          <section className="mb-12" role="region" aria-labelledby="campaign-description-heading">
            <h2 id="campaign-description-heading" className="text-2xl font-bold text-gray-900 mb-6">
              About This Campaign
            </h2>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: campaign.description }} 
            />
          </section>
        )}

        <section
          className="mb-12"
          role="region"
          aria-labelledby="endorsements-heading"
          ref={endorsementSectionRef}
        >
          <h2 id="endorsements-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Endorsements
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {EndorsementsListComponent && (
                <EndorsementsListComponent
                  campaignId={campaign.id}
                  refreshTrigger={refreshEndorsements}
                  onCountUpdate={handleEndorsementCountUpdate}
                />
              )}
            </div>

            <div>
              {EndorsementFormComponent && (
                <EndorsementFormComponent
                  ref={endorsementFormRef}
                  campaign={campaign}
                  onEndorsementSubmitted={handleEndorsementSubmitted}
                  onFormInteraction={handleFormInteraction}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CampaignDetail;