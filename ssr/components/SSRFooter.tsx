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
      LinkComponent={({ href, children, className }) => (
        <Link href={href || "/"} className={className}>
          {children}
        </Link>
      )}
    />
  );
};

export default SSRFooter;