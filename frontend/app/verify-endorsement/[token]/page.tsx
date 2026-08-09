"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../../../services/api";

interface VerifyEndorsementPageProps {
  params: Promise<{ token: string }>;
}

type VerificationState = "verifying" | "verified" | "failed";

export default function VerifyEndorsementPage({
  params,
}: VerifyEndorsementPageProps) {
  const [verificationState, setVerificationState] =
    useState<VerificationState>("verifying");
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    const verifyToken = async () => {
      try {
        const { token } = await params;
        await API.verifyEndorsement(token);
        if (isActive) {
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
            Thank you. Your endorsement is now under review.
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
            problem continues, return to the campaign and submit the form again
            to request a new verification email.
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
