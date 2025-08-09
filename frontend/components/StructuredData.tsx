/**
 * Structured data component for SEO
 * Adds JSON-LD structured data to pages for better search engine understanding
 */

import Script from "next/script";

interface OrganizationSchema {
  name: string;
  description?: string;
  url: string;
  email?: string;
}

interface CampaignSchema {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  author: string;
  image?: string;
}

interface WebPageSchema {
  title: string;
  description: string;
  url: string;
}

export function OrganizationStructuredData({
  name,
  description,
  url,
  email,
}: OrganizationSchema) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description,
    url,
    email: email ? `mailto:${email}` : undefined,
    "@id": url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}

export function CampaignStructuredData({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author,
  image,
}: CampaignSchema) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: author,
    },
    image: image ? [image] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <Script
      id="campaign-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}

export function WebPageStructuredData({
  title,
  description,
  url,
}: WebPageSchema) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    "@id": url,
    isPartOf: {
      "@type": "WebSite",
      url: (() => {
        if (process.env.NEXT_PUBLIC_SITE_URL)
          return process.env.NEXT_PUBLIC_SITE_URL;
        try {
          return new URL(url).origin;
        } catch {
          return "";
        }
      })(),
    },
  };

  return (
    <Script
      id="webpage-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}
