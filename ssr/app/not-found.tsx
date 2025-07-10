import React from "react";

export default function NotFound() {
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
          fontSize: "4rem",
          fontWeight: "bold",
          color: "#374151",
          marginBottom: "1rem",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "1.5rem",
          color: "#6b7280",
          marginBottom: "1rem",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: "#9ca3af",
          marginBottom: "2rem",
          maxWidth: "600px",
        }}
      >
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
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
    </div>
  );
}
