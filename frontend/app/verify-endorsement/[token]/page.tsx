"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../../../services/api";
import type { EndorsementVerification } from "../../../types";

interface VerifyEndorsementPageProps {
  params: Promise<{ token: string }>;
}

type VerificationState = "verifying" | "verified" | "failed";

function verificationConfirmation(
  status: EndorsementVerification["status"] | null
): string {
  if (status === "approved") {
    return "Thank you. Your endorsement has been approved.";
  }
  if (status === "rejected") {
    return "Your email is verified. This endorsement was not approved.";
  }
  return "Thank you. Your endorsement is now under review.";
}

export default function VerifyEndorsementPage({
  params,
}: VerifyEndorsementPageProps) {
  const [verificationState, setVerificationState] =
    useState<VerificationState>("verifying");
  const [verificationStatus, setVerificationStatus] = useState<
    EndorsementVerification["status"] | null
  >(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    const verifyToken = async () => {
      try {
        const { token } = await params;
        const verification = await API.verifyEndorsement(token);
        if (isActive) {
          setVerificationStatus(verification.status);
          setVerificationState("verified");
        }
      } catch {
        if (isActive) {
          setVerificationState("failed");
        }
      }
    };

    void verifyToken();
    return () => {
      isActive = false;
    };
  }, [params, verificationAttempt]);

  const retryVerification = () => {
    setVerificationStatus(null);
    setVerificationState("verifying");
    setVerificationAttempt((previousAttempt) => previousAttempt + 1);
  };

  return (
    <section className="mx-auto max-w-2xl px-6 py-20 text-center">
      {verificationState === "verifying" && (
        <>
          <h1 className="text-3xl font-bold text-gray-900">
            Verifying your endorsement…
          </h1>
          <p className="mt-4 text-gray-600">This should only take a moment.</p>
        </>
      )}

      {verificationState === "verified" && (
        <>
          <h1 className="text-3xl font-bold text-gray-900">
            Endorsement verified
          </h1>
          <p className="mt-4 text-gray-600">
            {verificationConfirmation(verificationStatus)}
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-md bg-blue-600 px-5 py-3 font-semibold text-white no-underline hover:bg-blue-700"
          >
            Return home
          </Link>
        </>
      )}

      {verificationState === "failed" && (
        <>
          <h1 className="text-3xl font-bold text-gray-900">
            Verification failed
          </h1>
          <p className="mt-4 text-gray-600">
            We could not verify your endorsement right now. Try again. If the
            problem continues, contact the campaign organizers to request a new
            link.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              onClick={retryVerification}
            >
              Try again
            </button>
            <Link
              href="/campaigns"
              className="inline-block rounded-md border border-blue-600 px-5 py-3 font-semibold text-blue-700 no-underline hover:bg-blue-50"
            >
              View campaigns
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
