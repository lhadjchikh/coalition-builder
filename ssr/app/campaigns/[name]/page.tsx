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
    // Efficiently fetch the specific campaign by name
    const campaign = await apiClient.getCampaignByName(resolvedParams.name);

    // Return the CampaignDetail component with the full campaign data
    return <CampaignDetailWrapper campaign={campaign} />;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    notFound();
  }
}

// Generate static params for all campaigns
export async function generateStaticParams() {
  // Skip API calls during test builds when no API server is available
  if (
    process.env.NODE_ENV === "test" ||
    process.env.SKIP_STATIC_GENERATION === "true"
  ) {
    return [];
  }

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
    const campaign = await apiClient.getCampaignByName(resolvedParams.name);

    return {
      title: campaign.title,
      description: campaign.summary,
    };
  } catch (error) {
    return {
      title: "Campaign Not Found",
    };
  }
}
