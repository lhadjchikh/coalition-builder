import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify endorsement",
  robots: "noindex, nofollow",
};

export default function VerifyEndorsementLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
