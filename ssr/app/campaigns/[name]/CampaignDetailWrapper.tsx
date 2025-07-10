"use client";

import CampaignDetail from "@frontend/components/CampaignDetail";
import "@frontend/components/Endorsements.css";
import "@frontend/App.css";

interface CampaignDetailWrapperProps {
  campaignId: number;
}

export default function CampaignDetailWrapper({
  campaignId,
}: CampaignDetailWrapperProps) {
  return <CampaignDetail campaignId={campaignId} />;
}
