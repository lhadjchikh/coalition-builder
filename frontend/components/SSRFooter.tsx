"use client";

import React from "react";
import Link from "next/link";
import Footer from "./Footer";
import { HomePage } from "../types";

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
