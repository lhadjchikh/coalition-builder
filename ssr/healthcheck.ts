/**
 * Health check script for Docker container
 *
 * This script checks the health of the Next.js SSR service by
 * making a request to the dedicated health endpoint.
 */

import * as http from "http";
import * as os from "os";

interface HealthResponse {
  status: string;
  api?: {
    status: string;
  };
}

// Configuration
const options: http.RequestOptions = {
  hostname: os.hostname() || "localhost",
  port: parseInt(process.env.PORT || "3000"),
  path: "/health",
  method: "GET",
  timeout: 3000,
  headers: {
    Accept: "application/json",
  },
};

// Execute health check
const req = http.request(options, (res: http.IncomingMessage) => {
  let data = "";

  // Collect response data
  res.on("data", (chunk: Buffer) => {
    data += chunk;
  });

  // Process the complete response
  res.on("end", () => {
    if (res.statusCode === 200) {
      try {
        // Parse the JSON response
        const healthData: HealthResponse = JSON.parse(data);

        // Check if the SSR service itself is healthy
        // During startup, API might be temporarily disconnected - this is acceptable
        // We exit with code 0 (success) as long as SSR is healthy, even if API is disconnected,
        // because this allows containers to start in any order without health check failures
        if (healthData.status === "healthy") {
          const apiStatus = healthData.api?.status || "unknown";
          if (apiStatus === "connected") {
            console.log("✅ Health check passed - API connection verified");
          } else {
            console.log(
              `✅ Health check passed - SSR healthy (API: ${apiStatus})`,
            );
          }
          process.exit(0);
        } else {
          console.error(
            `❌ Health check failed - Status: ${healthData.status}, API: ${healthData.api?.status}`,
          );
          process.exit(1);
        }
      } catch (e: unknown) {
        const error = e as Error;
        console.error(
          `❌ Health check failed - Invalid JSON response: ${error.message}`,
        );
        process.exit(1);
      }
    } else {
      console.error(`❌ Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

// Handle connection errors
req.on("error", (err: Error) => {
  console.error(`❌ Health check failed: ${err.message}`);
  process.exit(1);
});

// Handle timeouts
req.on("timeout", () => {
  console.error("❌ Health check timed out");
  req.destroy();
  process.exit(1);
});

// Send the request
req.end();
