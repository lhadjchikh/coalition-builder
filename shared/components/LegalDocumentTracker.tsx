"use client";

import React, { useEffect } from "react";
import analytics from "../services/analytics";

interface LegalDocumentTrackerProps {
  documentType: "terms" | "privacy";
}

/**
 * Client-side component to track legal document views.
 * This component renders nothing but tracks analytics when mounted.
 */
export default function LegalDocumentTracker({
  documentType,
}: LegalDocumentTrackerProps): null {
  useEffect(() => {
    // Track legal document view
    analytics.trackLegalDocumentView(documentType);
  }, [documentType]);

  // This component renders nothing
  return null;
}
