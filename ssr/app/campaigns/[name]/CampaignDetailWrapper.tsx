"use client";

import CampaignDetail from "@shared/components/CampaignDetail";
import EndorsementForm from "@frontend/components/EndorsementForm";
import EndorsementsList from "@frontend/components/EndorsementsList";
import GrowthIcon from "@frontend/components/GrowthIcon";
import "@frontend/components/Endorsements.css";
import "@frontend/App.css";
import type { Campaign } from "@frontend/types";

interface CampaignDetailWrapperProps {
  campaign: Campaign;
}

export default function CampaignDetailWrapper({
  campaign,
}: CampaignDetailWrapperProps) {
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
    <CampaignDetail
      campaignId={campaign.id}
      initialCampaign={campaign}
      apiClient={apiClient}
      EndorsementFormComponent={EndorsementForm}
      EndorsementsListComponent={EndorsementsList}
      GrowthIconComponent={GrowthIcon}
    />
  );
}
