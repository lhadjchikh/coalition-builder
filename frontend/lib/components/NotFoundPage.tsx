import React from "react";
import styles from "./NotFoundPage.module.css";

interface NotFoundPageProps {
  title?: string;
  message?: string;
  showCampaignLink?: boolean;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = "404",
  message = "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  showCampaignLink = false,
}) => {
  const is404 = title === "404";
  const titleClass = is404 ? styles.title404 : styles.titleOther;
  const messageClass = is404 ? styles.message404 : styles.messageOther;

  return (
    <div className={styles.container}>
      <h1 className={`${styles.title} ${titleClass}`}>{title}</h1>
      {is404 && <h2 className={styles.subtitle}>Page Not Found</h2>}
      <p className={`${styles.message} ${messageClass}`}>{message}</p>
      <div className={styles.buttons}>
        <a href="/" className={`${styles.button} ${styles.buttonPrimary}`}>
          Go Home
        </a>
        {showCampaignLink && (
          <a
            href="/campaigns"
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            View All Campaigns
          </a>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
