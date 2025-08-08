"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import ImageWithCredit from "./ImageWithCredit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare, faTimes } from "@fortawesome/free-solid-svg-icons";
import SocialShareButtons from "./SocialShareButtons";

// Generic interfaces that work with both frontend and SSR
interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  image_url?: string;
  image_alt_text?: string;
  image_author?: string;
  image_license?: string;
  image_source_url?: string;
  image_caption?: string;
  image_caption_display?: "below" | "overlay" | "tooltip" | "none";
  allow_endorsements?: boolean;
  active?: boolean;
  created_at?: string;
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
    stage: "seed" | "seedling" | "tree";
    size: string;
    color: string;
  }>;
  className?: string;
}

// Configuration constants
const SOCIAL_PROOF_THRESHOLD = 10;
const MOMENTUM_DISPLAY_THRESHOLD = 25;

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
}: CampaignDetailProps) => {
  const [campaign, setCampaign] = useState<Campaign | null>(
    initialCampaign || null,
  );
  const [loading, setLoading] = useState<boolean>(!initialCampaign);
  const [error, setError] = useState<string | null>(null);
  const [refreshEndorsements, setRefreshEndorsements] = useState<number>(0);
  const [showStickyCard, setShowStickyCard] = useState<boolean>(false);
  const [endorsementCount, setEndorsementCount] = useState<number>(0);
  const [recentEndorsements, setRecentEndorsements] = useState<number>(0);
  const [isFormActive, setIsFormActive] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const endorsementSectionRef = useRef<HTMLElement>(null);
  const endorsementFormRef = useRef<any>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Skip fetching if we already have initial campaign data
    if (initialCampaign) {
      // Track campaign view for initial campaign
      analytics?.trackCampaignView(
        initialCampaign.name || `Campaign ${initialCampaign.id}`,
      );
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
          throw new Error("Either campaignId or campaignName must be provided");
        }

        setCampaign(data);

        // Track campaign view only if data exists
        if (data) {
          analytics?.trackCampaignView(data.name || `Campaign ${data.id}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch campaign",
        );
      } finally {
        setLoading(false);
      }
    };

    if (campaignId || campaignName) {
      fetchCampaign();
    } else {
      // Handle the case where neither ID nor name is provided
      setLoading(false);
      setError("Either campaignId or campaignName must be provided");
    }
  }, [campaignId, campaignName, initialCampaign, apiClient, analytics]);

  const handleEndorsementSubmitted = () => {
    // Trigger a refresh of the endorsements list
    setRefreshEndorsements((prev: number) => prev + 1);
  };

  const handleEndorsementCountUpdate = (
    count: number,
    recentCount?: number,
  ) => {
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
    const handleScroll = () => {
      if (aboutSectionRef.current && endorsementSectionRef.current) {
        const aboutRect = aboutSectionRef.current.getBoundingClientRect();
        const endorsementRect =
          endorsementSectionRef.current.getBoundingClientRect();

        // Show sticky CTA when the About section reaches the top of the viewport
        // and hide it when the endorsement section is in view
        const shouldShow =
          aboutRect.top <= 0 && endorsementRect.top > window.innerHeight * 0.8;
        setShowStickyCard(shouldShow);
      }
    };

    // Call once on mount to set initial state
    handleScroll();

    // Only add scroll listener in browser environment
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-testid="campaign-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-testid="campaign-error"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error loading campaign
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-testid="campaign-not-found"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Campaign not found
          </h1>
          <p className="text-gray-600">
            The campaign you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-testid="campaign-detail">
      {/* Hero Image Section */}
      {campaign.image_url && (
        <div className="relative mb-8">
          <ImageWithCredit
            src={campaign.image_url}
            alt={campaign.image_alt_text || `Hero image for ${campaign.title}`}
            title={campaign.title}
            author={campaign.image_author}
            license={campaign.image_license}
            sourceUrl={campaign.image_source_url}
            caption={campaign.image_caption}
            captionDisplay={campaign.image_caption_display}
            creditDisplay="overlay"
            imgClassName="w-full h-96 object-cover"
            className="w-full"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40">
            <div className="h-full flex items-center px-5 sm:px-8">
              <div className="text-white max-w-prose-container">
                <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl mb-4">
                  {campaign.title}
                </h1>
                <p className="text-xl">{campaign.summary}</p>
              </div>
            </div>
          </div>
          {/* Share Icon Overlay */}
          <button
            onClick={() => setShowShareModal(true)}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Share this campaign"
          >
            <FontAwesomeIcon icon={faShare} className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close share modal"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-3 text-center">Share this campaign</h2>
            <SocialShareButtons
              url={
                typeof window !== "undefined"
                  ? `${window.location.origin}/campaigns/${campaign.name}`
                  : ""
              }
              title={campaign.title}
              description={campaign.summary || campaign.description}
              hashtags={[
                "PolicyChange",
                "CivicEngagement",
                campaign.name?.replace(/-/g, "") || "",
              ]}
              campaignName={campaign.name}
              showLabel={false}
              className="modal-share"
            />
          </div>
        </div>
      )}

      {/* Sticky Endorsement CTA */}
      {campaign.allow_endorsements && showStickyCard && !isFormActive && (
        <div className="fixed top-0 left-0 right-0 bg-theme-accent-dark text-white z-50 shadow-lg">
          <div className="sticky-cta-container mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between h-20">
              <span className="text-lg font-medium">
                Support this campaign!
              </span>
              <Button
                variant="accent-inverted"
                size="md"
                onClick={scrollToEndorsementForm}
                aria-label="Scroll to endorsement form"
              >
                Endorse Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="py-8">
        <header className="mb-8">
          {/* Only show title and summary in header if there's no hero image */}
          {!campaign.image_url && (
            <div className="header-content-wrapper text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-4">
                {campaign.title}
              </h1>
              <p className="text-xl text-gray-600">{campaign.summary}</p>
            </div>
          )}

          <div className="header-content-wrapper">
            {/* Smart Social Proof Section */}
            {campaign.allow_endorsements &&
              endorsementCount >= SOCIAL_PROOF_THRESHOLD && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    {GrowthIconComponent && (
                      <div className="flex-shrink-0">
                        <GrowthIconComponent
                          stage="tree"
                          size="48px"
                          color="#4caf50"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-green-800">
                        {endorsementCount}{" "}
                        {endorsementCount === 1
                          ? "Endorsement"
                          : "Endorsements"}
                      </div>
                      <p className="text-green-700">
                        Join {endorsementCount} supporters backing this campaign
                      </p>
                    </div>
                  </div>
                  {recentEndorsements > 0 &&
                    endorsementCount >= MOMENTUM_DISPLAY_THRESHOLD && (
                      <div className="bg-yellow-100 border border-yellow-200 rounded px-3 py-1 inline-block">
                        <span className="text-yellow-800 text-sm font-medium">
                          ✨ {recentEndorsements} new{" "}
                          {recentEndorsements === 1
                            ? "endorsement"
                            : "endorsements"}{" "}
                          this week
                        </span>
                      </div>
                    )}
                </div>
              )}

            {/* Early Supporter Appeal (1-9 endorsements) */}
            {campaign.allow_endorsements &&
              endorsementCount > 0 &&
              endorsementCount < SOCIAL_PROOF_THRESHOLD && (
                <div className="cta-card">
                  <h3 className="cta-heading">Join the Early Supporters</h3>
                  {GrowthIconComponent && (
                    <div className="cta-icon">
                      <GrowthIconComponent
                        stage="seedling"
                        size="48px"
                        color="#4caf50"
                      />
                    </div>
                  )}
                  <p className="cta-text">
                    Be among the founding voices advocating for this important initiative.
                  </p>
                  <div className="cta-button-wrapper">
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={scrollToEndorsementForm}
                    >
                      Join the Early Supporters
                    </Button>
                    <p className="cta-supporting-text">
                      Join this growing movement in its early stages.
                    </p>
                  </div>
                </div>
              )}

            {/* First Endorser CTA - when no endorsements yet */}
            {campaign.allow_endorsements && endorsementCount === 0 && (
              <div className="cta-card">
                <h3 className="cta-heading">Be the First to Show Support</h3>
                {GrowthIconComponent && (
                  <div className="cta-icon">
                    <GrowthIconComponent
                      stage="seed"
                      size="48px"
                      color="#4caf50"
                    />
                  </div>
                )}
                <p className="cta-text">
                  Help launch this campaign by adding your voice to this important cause.
                </p>
                <div className="cta-button-wrapper">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={scrollToEndorsementForm}
                  >
                    Be the First to Endorse
                  </Button>
                </div>
              </div>
            )}

            {/* Regular CTA for 10+ endorsements */}
            {campaign.allow_endorsements && endorsementCount >= SOCIAL_PROOF_THRESHOLD && (
              <div className="text-center mb-8">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={scrollToEndorsementForm}
                >
                  Add Your Endorsement
                </Button>
              </div>
            )}
          </div>
        </header>

        {campaign.description && (
          <section
            className="mb-12"
            role="region"
            aria-labelledby="campaign-description-heading"
            ref={aboutSectionRef}
            className="about-section-wrapper"
          >
            <h2
              id="campaign-description-heading"
              className="text-3xl font-bold text-gray-900 mb-6"
            >
              About This Campaign
            </h2>
            <div
              className="prose prose-lg text-gray-700"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          </section>
        )}

        <section
          className="mb-0"
          role="region"
          aria-labelledby="endorsements-heading"
          ref={endorsementSectionRef}
        >
          {/* Only show header if there are endorsements */}
          {endorsementCount > 0 && (
            <h2
              id="endorsements-heading"
              className="text-2xl font-bold text-gray-900 mb-6"
            >
              Endorsements
            </h2>
          )}

          <div className={endorsementCount > 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : ""}>
            {endorsementCount > 0 && (
              <div>
                {EndorsementsListComponent && (
                  <EndorsementsListComponent
                    campaignId={campaign.id}
                    refreshTrigger={refreshEndorsements}
                    onCountUpdate={handleEndorsementCountUpdate}
                  />
                )}
              </div>
            )}

            <div className={endorsementCount === 0 ? "max-w-2xl mx-auto" : ""}>
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
