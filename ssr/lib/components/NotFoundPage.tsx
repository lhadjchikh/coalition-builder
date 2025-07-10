import React from "react";

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
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1
        style={{
          fontSize: title === "404" ? "4rem" : "3rem",
          fontWeight: "bold",
          color: "#374151",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h1>
      {title === "404" && (
        <h2
          style={{
            fontSize: "1.5rem",
            color: "#6b7280",
            marginBottom: "1rem",
          }}
        >
          Page Not Found
        </h2>
      )}
      <p
        style={{
          color: title === "404" ? "#9ca3af" : "#6b7280",
          marginBottom: "2rem",
          maxWidth: "600px",
          fontSize: title === "404" ? "1rem" : "1.1rem",
        }}
      >
        {message}
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <a
          href="/"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "1rem",
            fontWeight: "500",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          Go Home
        </a>
        {showCampaignLink && (
          <a
            href="/campaigns"
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#4b5563";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6b7280";
            }}
          >
            View All Campaigns
          </a>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;
