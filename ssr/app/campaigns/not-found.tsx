import React from "react";

export default function CampaignNotFound() {
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
          fontSize: "3rem",
          fontWeight: "bold",
          color: "#374151",
          marginBottom: "1rem",
        }}
      >
        Campaign Not Found
      </h1>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "2rem",
          maxWidth: "600px",
          fontSize: "1.1rem",
        }}
      >
        The campaign you are looking for does not exist or may have been
        removed.
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
      </div>
    </div>
  );
}
