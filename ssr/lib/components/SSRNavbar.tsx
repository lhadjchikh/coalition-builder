"use client";

import React from "react";
import { NavItemData } from "@shared/types";

interface SSRNavbarProps {
  organizationName: string;
  navItems: NavItemData[];
}

const SSRNavbar: React.FC<SSRNavbarProps> = ({
  organizationName,
  navItems,
}) => {
  return (
    <nav
      style={{
        backgroundColor: "#282c34",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        {organizationName}
      </div>

      <ul
        style={{
          listStyle: "none",
          display: "flex",
          gap: "2rem",
          margin: 0,
          padding: 0,
        }}
      >
        {navItems.map((item, index) => (
          <li key={index}>
            <a
              href={item.href}
              style={{
                color: "white",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                transition: "background-color 0.2s, outline 0.2s",
                outline: "2px solid transparent",
                outlineOffset: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #61dafb";
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "2px solid transparent";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SSRNavbar;
