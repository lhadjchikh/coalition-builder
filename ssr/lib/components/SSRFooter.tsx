import React from "react";
import Link from "next/link";
import styles from "./SSRFooter.module.css";
import { HomePage } from "@shared/types";

interface SSRFooterProps {
  orgInfo?: HomePage;
}

const SSRFooter: React.FC<SSRFooterProps> = ({ orgInfo }) => {
  const organizationName = orgInfo?.organization_name || "Coalition Builder";
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <nav className={styles.legalLinks} aria-label="Legal links">
            <Link href="/terms" className={styles.legalLink}>
              Terms of Use
            </Link>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
          </nav>
          <p className={styles.copyright}>
            © {year} {organizationName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SSRFooter;
