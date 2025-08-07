"use client";

import { useState } from "react";
import CampaignDetail from "@shared/components/CampaignDetail";
import EndorsementForm from "@frontend/components/EndorsementForm";
import EndorsementsList from "@frontend/components/EndorsementsList";
import GrowthIcon from "@frontend/components/GrowthIcon";
import SocialShareButtons from "../../../components/SocialShareButtonsWrapper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare, faTimes } from "@fortawesome/free-solid-svg-icons";
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
      <div className="campaign-detail">
        <CampaignDetail
          campaignId={campaign.id}
          initialCampaign={campaign}
          apiClient={apiClient}
          EndorsementFormComponent={EndorsementForm}
          EndorsementsListComponent={EndorsementsList}
          GrowthIconComponent={GrowthIcon}
          className=""
        />

        {/* Social Share Section */}
        <div className="endorsement-form" style={{ textAlign: 'center', margin: '2rem auto' }}>
          <h3>Help Spread the Word</h3>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
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
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
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
            <FontAwesomeIcon icon={faShare} className="w-6 h-6" />
          </button>
        )}
      </div>
    </>
  );
}
