import React from "react";
import NotFoundPage from "../../lib/components/NotFoundPage";

export default function CampaignNotFound() {
  return (
    <NotFoundPage
      title="Campaign Not Found"
      message="The campaign you are looking for does not exist or may have been removed."
      showCampaignLink={true}
    />
  );
}
