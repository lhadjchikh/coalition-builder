"use client";

import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import ImageWithCredit from "./ImageWithCredit";

// Generic campaign interface that works with both frontend and SSR
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
}

interface CampaignsListProps {
  campaigns: Campaign[];
  onCampaignSelect?: (campaign: Campaign) => void;
  loading?: boolean;
  error?: string | null;
  showHeading?: boolean;
  headingText?: string;
  className?: string;
  cardClassName?: string;
  gridClassName?: string;
}

const CampaignsList: React.FC<CampaignsListProps> = ({
  campaigns,
  onCampaignSelect,
  loading = false,
  error = null,
  showHeading = false,
  headingText = "Policy Campaigns",
  className = "",
  cardClassName = "",
  gridClassName,
}) => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Dynamic grid class based on campaign count for better tablet layout
  const getGridClassName = () => {
    if (gridClassName) return gridClassName;

    const campaignCount = campaigns.length;

    if (campaignCount === 1) {
      // Single card: center on all screen sizes with max width
      return "grid grid-cols-1 gap-6 lg:gap-8 justify-items-center max-w-md mx-auto";
    } else {
      // Multiple cards: responsive grid
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8";
    }
  };

  useEffect(() => {
    // Skip animation in SSR or if IntersectionObserver is not available
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisibleCards(new Set(campaigns.map((c) => c.id)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const campaignId = parseInt(
              entry.target.getAttribute("data-campaign-id") || "0",
            );
            setVisibleCards((prev) => new Set(prev).add(campaignId));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    );

    // Observe all card elements
    cardRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [campaigns]);
  if (loading) {
    return (
      <div className="text-center text-gray-600" data-testid="loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-xl"
        data-testid="error"
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`campaigns-list ${className}`} data-testid="campaigns-list">
      {showHeading && (
        <h2 className="h2 text-theme-heading mb-10">{headingText}</h2>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No campaigns are currently available.</p>
        </div>
      ) : (
        <div className={getGridClassName()}>
          {campaigns.map((campaign, index) => {
            const isVisible = visibleCards.has(campaign.id);
            const animationDelay = index * 100; // 100ms delay between each card

            return (
              <div
                key={campaign.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(campaign.id, el);
                }}
                className={`
                  card-modern overflow-hidden cursor-pointer group p-0
                  campaign-card-animate ${isVisible ? "campaign-card-visible" : ""}
                  ${cardClassName}
                `}
                data-testid={`campaign-${campaign.id}`}
                data-campaign-id={campaign.id}
                style={{ transitionDelay: `${animationDelay}ms` }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${campaign.title}`}
                onClick={() => onCampaignSelect?.(campaign)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCampaignSelect?.(campaign);
                  }
                }}
              >
                {campaign.image_url && (
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <ImageWithCredit
                      src={campaign.image_url}
                      alt={campaign.image_alt_text || campaign.title}
                      title={campaign.title}
                      author={campaign.image_author}
                      license={campaign.image_license}
                      sourceUrl={campaign.image_source_url}
                      caption={campaign.image_caption}
                      captionDisplay={campaign.image_caption_display}
                      creditDisplay="overlay"
                      imgClassName="w-full h-full object-cover"
                      className="w-full h-full"
                    />
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <h3 className="h4 text-theme-heading mb-3 break-normal">
                    {campaign.title}
                  </h3>

                  <p className="text-body text-theme-text-body mb-6 break-normal hyphens-none">
                    {campaign.summary}
                  </p>

                  {campaign.allow_endorsements && (
                    <div className="mb-4">
                      <span className="inline-flex items-start text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full text-xs sm:text-sm leading-tight">
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0 mt-0.5"
                        />
                        <span className="hyphens-none word-break-normal">
                          Accepting endorsements
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-theme-primary font-semibold group-hover:text-theme-primary-dark transition-colors">
                      Learn More →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
