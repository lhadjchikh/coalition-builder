"use client";

import React from "react";

// Generic campaign interface that works with both frontend and SSR
interface Campaign {
  id: number;
  name: string;
  title: string;
  summary: string;
  description?: string;
  image_url?: string;
  image_alt_text?: string;
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
  gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
}) => {
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
        className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded"
        data-testid="error"
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`campaigns-list ${className}`} data-testid="campaigns-list">
      {showHeading && (
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{headingText}</h2>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No campaigns are currently available.</p>
        </div>
      ) : (
        <div className={gridClassName}>
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className={`
                bg-white rounded-lg shadow-md overflow-hidden 
                hover:shadow-xl transition-all duration-300 
                cursor-pointer group border border-gray-200
                hover:border-gray-300 transform hover:-translate-y-1
                ${cardClassName}
              `}
              data-testid={`campaign-${campaign.id}`}
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
                  <img
                    src={campaign.image_url}
                    alt={campaign.image_alt_text || campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {campaign.title}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {campaign.summary}
                </p>

                {campaign.allow_endorsements && (
                  <div className="mb-4">
                    <span className="inline-flex items-center text-green-600 text-sm font-medium">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Accepting endorsements
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-theme-primary font-semibold group-hover:text-theme-primary-dark transition-colors">
                    Learn More →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
