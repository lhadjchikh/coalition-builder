import { notFound } from "next/navigation";
import { apiClient } from "../../../lib/api";
import CampaignDetailWrapper from "./CampaignDetailWrapper";

interface CampaignPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const resolvedParams = await params;
  try {
    // First, fetch all campaigns to find the one with matching name
    const campaigns = await apiClient.getCampaigns();
    const campaign = campaigns.find((c) => c.name === resolvedParams.name);

    if (!campaign) {
      notFound();
    }

    // Return the CampaignDetail component with the campaign ID
    return <CampaignDetailWrapper campaignId={campaign.id} />;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    notFound();
  }
}

// Generate static params for all campaigns
export async function generateStaticParams() {
  try {
    const campaigns = await apiClient.getCampaigns();
    return campaigns.map((campaign) => ({
      name: campaign.name,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Metadata for the page
export async function generateMetadata({ params }: CampaignPageProps) {
  const resolvedParams = await params;
  try {
    const campaigns = await apiClient.getCampaigns();
    const campaign = campaigns.find((c) => c.name === resolvedParams.name);

    if (!campaign) {
      return {
        title: "Campaign Not Found",
      };
    }

    return {
      title: campaign.title,
      description: campaign.summary,
    };
  } catch (error) {
    return {
      title: "Campaign",
    };
  }
}
