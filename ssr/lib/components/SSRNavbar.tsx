"use client";

import React from "react";
import { NavItemData } from "@shared/types";
import styles from "./SSRNavbar.module.css";

interface SSRNavbarProps {
  organizationName: string;
  navItems: NavItemData[];
}

const SSRNavbar: React.FC<SSRNavbarProps> = ({
  organizationName,
  navItems,
}) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.organizationName}>{organizationName}</div>

      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.href}>
            <a href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SSRNavbar;
