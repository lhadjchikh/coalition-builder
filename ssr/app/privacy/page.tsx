import React from "react";
import { notFound } from "next/navigation";
import { apiClient } from "../../lib/api";
import LegalDocumentTracker from "../../components/LegalDocumentTracker";

interface PrivacyPageProps {}

export default async function PrivacyPage({}: PrivacyPageProps): Promise<React.ReactElement> {
  let privacyData = null;
  let error = null;

  try {
    privacyData = await apiClient.getPrivacyPolicy();
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load privacy policy";
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">
              Error loading privacy policy: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!privacyData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LegalDocumentTracker documentType="privacy" title={privacyData.title} />
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{privacyData.title}</h1>
          <p className="text-gray-600">
            Version {privacyData.version} | Effective Date:{" "}
            {new Date(privacyData.effective_date).toLocaleDateString()}
          </p>
        </header>
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: privacyData.content }} />
        </div>
      </div>
    </div>
  );
}
