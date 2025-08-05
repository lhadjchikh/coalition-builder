import { notFound } from "next/navigation";
import { apiClient } from "../../../lib/api";
import CampaignDetailWrapper from "./CampaignDetailWrapper";
import {
  CampaignStructuredData,
  BreadcrumbStructuredData,
} from "../../../components/StructuredData";

// Force dynamic rendering at request time
export const dynamic = "force-dynamic";

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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://landandbay.org";
    const campaignUrl = `${siteUrl}/campaigns/${campaign.name}`;

    // Return the CampaignDetail component with the full campaign data and structured data
    return (
      <>
        <CampaignStructuredData
          title={campaign.title}
          description={campaign.summary}
          url={campaignUrl}
          datePublished={campaign.created_at}
          dateModified={campaign.created_at}
          author={process.env.ORGANIZATION_NAME || "Coalition Builder"}
          image={campaign.image_url}
        />
        <BreadcrumbStructuredData
          items={[
            { name: "Home", url: siteUrl },
            { name: "Campaigns", url: `${siteUrl}/campaigns` },
            { name: campaign.title, url: campaignUrl },
          ]}
        />
        <CampaignDetailWrapper campaign={campaign} />
      </>
    );
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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://landandbay.org";
    const campaignUrl = `${siteUrl}/campaigns/${campaign.name}`;

    return {
      title: campaign.title,
      description: campaign.summary,
      openGraph: {
        title: campaign.title,
        description: campaign.summary,
        url: campaignUrl,
        siteName: process.env.ORGANIZATION_NAME || "Coalition Builder",
        images: campaign.image_url
          ? [
              {
                url: campaign.image_url,
                width: 1200,
                height: 630,
                alt: campaign.title,
              },
            ]
          : [],
        type: "article",
        publishedTime: campaign.created_at,
        modifiedTime: campaign.created_at,
      },
      twitter: {
        card: "summary_large_image",
        title: campaign.title,
        description: campaign.summary,
        images: campaign.image_url ? [campaign.image_url] : [],
      },
      alternates: {
        canonical: campaignUrl,
      },
    };
  } catch (error) {
    return {
      title: "Campaign Not Found",
      robots: "noindex, nofollow",
    };
  }
}
