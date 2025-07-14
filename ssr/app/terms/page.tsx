import React from "react";
import { notFound } from "next/navigation";
import { apiClient } from "../../lib/api";

interface TermsPageProps {}

export default async function TermsPage({}: TermsPageProps): Promise<React.ReactElement> {
  let termsData = null;
  let error = null;

  try {
    termsData = await apiClient.getTermsOfUse();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load terms";
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading terms: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!termsData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{termsData.title}</h1>
          <p className="text-gray-600">
            Version {termsData.version} | Effective Date:{" "}
            {new Date(termsData.effective_date).toLocaleDateString()}
          </p>
        </header>
        <div className="prose prose-lg max-w-none">
          {/* Content is sanitized server-side in LegalDocument.save() to prevent XSS */}
          <div dangerouslySetInnerHTML={{ __html: termsData.content }} />
        </div>
      </div>
    </div>
  );
}
