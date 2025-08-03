"use client";

import React from "react";
import Link from "next/link";
import Footer from "@shared/components/Footer";
import { HomePage } from "@shared/types";

interface SSRFooterProps {
  orgInfo?: HomePage;
}

const SSRFooter: React.FC<SSRFooterProps> = ({ orgInfo }) => {
  return (
    <Footer
      orgInfo={orgInfo}
      LinkComponent={({ to, children, className }) => (
        <Link href={to || "/"} className={className}>
          {children}
        </Link>
      )}
    />
  );
};

export default SSRFooter;
