import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Campaign } from '../types';
import EndorsementForm, { EndorsementFormRef } from './EndorsementForm';
import EndorsementsList from './EndorsementsList';
import GrowthIcon from './GrowthIcon';
import './Endorsements.css';

interface CampaignDetailProps {
  campaignId?: number;
  campaignName?: string;
  initialCampaign?: Campaign;
}

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
  const endorsementFormRef = useRef<EndorsementFormRef>(null);

  useEffect(() => {
    // Skip fetching if we already have initial campaign data
    if (initialCampaign) {
      return;
    }

    const fetchCampaign = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let data: Campaign;
        if (campaignId) {
          data = await API.getCampaignById(campaignId);
        } else if (campaignName) {
          data = await API.getCampaignByName(campaignName);
        } else {
          throw new Error('Either campaignId or campaignName must be provided');
        }

        setCampaign(data);
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
  }, [campaignId, campaignName, initialCampaign]);

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
    endorsementFormRef.current?.scrollToFirstField();
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return <div data-testid="campaign-loading">Loading campaign...</div>;
  }

  if (error) {
    return <div data-testid="campaign-error">Error: {error}</div>;
  }

  if (!campaign) {
    return <div data-testid="campaign-not-found">Campaign not found</div>;
  }

  return (
    <div className="campaign-detail" data-testid="campaign-detail">
      {/* Sticky Endorsement CTA */}
      {campaign.allow_endorsements && showStickyCard && !isFormActive && (
        <div className="sticky-endorsement-cta">
          <div className="sticky-cta-content">
            <span className="sticky-cta-text">Support this campaign!</span>
            <button
              className="sticky-cta-button"
              onClick={scrollToEndorsementForm}
              aria-label="Scroll to endorsement form"
            >
              Endorse Now
            </button>
          </div>
        </div>
      )}

      <header className="campaign-header">
        <h1>{campaign.title}</h1>
        <p className="campaign-summary">{campaign.summary}</p>

        {/* Smart Social Proof Section */}
        {campaign.allow_endorsements && endorsementCount >= 10 && (
          <div className="social-proof">
            <div
              className="social-proof-content"
              style={{ ...SECTION_LAYOUT_STYLE, marginBottom: '1rem' }}
            >
              <div className="social-proof-icon" style={ICON_CONTAINER_STYLE}>
                <GrowthIcon stage="tree" size="48px" color="#4caf50" />
              </div>
              <div className="social-proof-text-content" style={TEXT_CONTENT_STYLE}>
                <div className="endorsement-stats">
                  <span className="endorsement-count">{endorsementCount}</span>
                  <span className="endorsement-label">
                    {endorsementCount === 1 ? 'Endorsement' : 'Endorsements'}
                  </span>
                </div>
                <p className="social-proof-text">
                  Join {endorsementCount} supporters backing this campaign
                </p>
              </div>
            </div>
            {recentEndorsements > 0 && endorsementCount >= 25 && (
              <div className="momentum-indicator">
                <span className="momentum-badge">
                  ✨ {recentEndorsements} new{' '}
                  {recentEndorsements === 1 ? 'endorsement' : 'endorsements'} this week
                </span>
              </div>
            )}
          </div>
        )}

        {/* Early Supporter Appeal (1-9 endorsements) */}
        {campaign.allow_endorsements && endorsementCount > 0 && endorsementCount < 10 && (
          <div className="early-supporter-appeal">
            <div className="early-supporter-content" style={SECTION_LAYOUT_STYLE}>
              <div className="early-supporter-icon" style={ICON_CONTAINER_STYLE}>
                <GrowthIcon stage="seedling" size="48px" color="#4caf50" />
              </div>
              <div className="early-supporter-text" style={TEXT_CONTENT_STYLE}>
                <h3>Join the Early Supporters</h3>
                <p>Be among the founding voices advocating for this important initiative.</p>
              </div>
            </div>
          </div>
        )}

        {/* First Endorser Appeal (0 endorsements) */}
        {campaign.allow_endorsements && endorsementCount === 0 && (
          <div className="first-endorser-appeal">
            <div className="first-endorser-content" style={SECTION_LAYOUT_STYLE}>
              <div className="first-endorser-icon" style={ICON_CONTAINER_STYLE}>
                <GrowthIcon stage="seed" size="48px" color="#4caf50" />
              </div>
              <div className="first-endorser-text" style={TEXT_CONTENT_STYLE}>
                <h3>Be the First to Show Support</h3>
                <p>Help launch this campaign by adding your voice to this important cause.</p>
              </div>
            </div>
          </div>
        )}

        {/* Prominent CTA in header */}
        {campaign.allow_endorsements && (
          <div className="header-cta">
            <button className="header-endorse-button" onClick={scrollToEndorsementForm}>
              {endorsementCount === 0
                ? 'Be the First to Endorse'
                : endorsementCount < 10
                  ? 'Join the Early Supporters'
                  : 'Add Your Endorsement'}
            </button>
            {endorsementCount === 0 && (
              <p className="first-endorser-text">Help launch this important initiative.</p>
            )}
            {endorsementCount > 0 && endorsementCount < 10 && (
              <p className="early-supporter-text">
                Join this growing movement in its early stages.
              </p>
            )}
          </div>
        )}
      </header>

      {campaign.description && (
        <section
          className="campaign-description"
          role="region"
          aria-labelledby="campaign-description-heading"
        >
          <h2 id="campaign-description-heading">About This Campaign</h2>
          <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
        </section>
      )}

      <section
        className="campaign-endorsements"
        role="region"
        aria-labelledby="endorsements-heading"
        ref={endorsementSectionRef}
      >
        <h2 id="endorsements-heading" className="endorsements-heading">
          Endorsements
        </h2>
        <div className="endorsements-container">
          <div className="endorsements-display">
            <EndorsementsList
              campaignId={campaign.id}
              refreshTrigger={refreshEndorsements}
              onCountUpdate={handleEndorsementCountUpdate}
            />
          </div>

          <div className="endorsement-form-container">
            <EndorsementForm
              ref={endorsementFormRef}
              campaign={campaign}
              onEndorsementSubmitted={handleEndorsementSubmitted}
              onFormInteraction={handleFormInteraction}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampaignDetail;
