"use client";

import { useState } from "react";
import CampaignDetail from "@shared/components/CampaignDetail";
import EndorsementForm from "@frontend/components/EndorsementForm";
import EndorsementsList from "@frontend/components/EndorsementsList";
import GrowthIcon from "@frontend/components/GrowthIcon";
import SocialShareButtons from "../../../components/SocialShareButtonsWrapper";
import "@frontend/components/Endorsements.css";
import "@frontend/App.css";
import type { Campaign } from "@frontend/types";

interface CampaignDetailWrapperProps {
  campaign: Campaign;
}

export default function CampaignDetailWrapper({
  campaign,
}: CampaignDetailWrapperProps) {
  const [showFloatingShare, setShowFloatingShare] = useState(false);

  // For SSR, we'll create a simplified API client
  const apiClient = {
    getCampaignById: async (id: number) => {
      // In SSR, we already have the campaign data, so just return it
      return campaign;
    },
    getCampaignByName: async (name: string) => {
      // In SSR, we already have the campaign data, so just return it
      return campaign;
    },
  };

  return (
    <>
      <CampaignDetail
        campaignId={campaign.id}
        initialCampaign={campaign}
        apiClient={apiClient}
        EndorsementFormComponent={EndorsementForm}
        EndorsementsListComponent={EndorsementsList}
        GrowthIconComponent={GrowthIcon}
      />

      {/* Social Share Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Help Spread the Word</h3>
          <p className="text-gray-600 mb-4">
            Share this campaign with your network to build support and momentum.
          </p>
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
          />
        </div>
      </div>

      {/* Floating Share Button for Mobile */}
      <div className="md:hidden">
        {showFloatingShare ? (
          <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <button
              onClick={() => setShowFloatingShare(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close share menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
              showLabel={true}
              className="compact"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowFloatingShare(true)}
            className="fixed bottom-4 right-4 z-40 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Share this campaign"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
