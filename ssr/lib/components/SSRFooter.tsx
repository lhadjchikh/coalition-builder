import React from "react";
import Link from "next/link";
import styles from "./SSRFooter.module.css";

interface SSRFooterProps {
  organizationName?: string;
  year?: number;
}

const SSRFooter: React.FC<SSRFooterProps> = ({
  organizationName = "Coalition Builder",
  year = new Date().getFullYear(),
}) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <nav className={styles.legalLinks}>
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
