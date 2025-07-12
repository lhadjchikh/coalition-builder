"use client";

import CampaignDetail from "@frontend/components/CampaignDetail";
import "@frontend/components/Endorsements.css";
import "@frontend/App.css";
import type { Campaign } from "@frontend/types";

interface CampaignDetailWrapperProps {
  campaign: Campaign;
}

export default function CampaignDetailWrapper({
  campaign,
}: CampaignDetailWrapperProps) {
  return <CampaignDetail campaignId={campaign.id} initialCampaign={campaign} />;
}
