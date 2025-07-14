"use client";

import React, { useEffect } from "react";
import analytics from "../lib/analytics";

interface LegalDocumentTrackerProps {
  documentType: "terms" | "privacy";
  title: string;
}

/**
 * Client-side component to track legal document views.
 * This is separate from the SSR page to handle analytics tracking.
 */
export default function LegalDocumentTracker({
  documentType,
  title,
}: LegalDocumentTrackerProps): null {
  useEffect(() => {
    // Track legal document view
    analytics.trackLegalDocumentView(documentType);
  }, [documentType]);

  // This component renders nothing
  return null;
}
