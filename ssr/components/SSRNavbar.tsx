"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@shared/components/Navbar";
import { NavItemData } from "@shared/types";

interface SSRNavbarProps {
  organizationName?: string;
  logoUrl?: string;
  logoAltText?: string;
  navItems?: NavItemData[];
}

const SSRNavbar: React.FC<SSRNavbarProps> = (props) => {
  return (
    <Navbar
      {...props}
      LinkComponent={({ href, children, className, onClick }) => (
        <Link href={href || "/"} className={className} onClick={onClick}>
          {children}
        </Link>
      )}
    />
  );
};

export default SSRNavbar;