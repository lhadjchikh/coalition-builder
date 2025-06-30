const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Experimental features
  experimental: {
    externalDir: true, // Allow importing from outside the project directory
  },

  // Webpack configuration to enable importing from frontend directory
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for importing from frontend and shared
    // Support both Docker (./shared) and local (../shared) paths
    const sharedPath = require("fs").existsSync(
      path.resolve(__dirname, "./shared"),
    )
      ? path.resolve(__dirname, "./shared")
      : path.resolve(__dirname, "../shared");

    config.resolve.alias = {
      ...config.resolve.alias,
      "@frontend": path.resolve(__dirname, "./frontend/src"),
      "@shared": sharedPath,
    };

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Allow importing from outside the root directory
    ignoreBuildErrors: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  serverRuntimeConfig: {
    API_URL: process.env.API_URL || "http://localhost:8000",
  },

  // Rewrites for API calls (optional - for development)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.API_URL || "http://localhost:8000"
        }/api/:path*`,
      },
    ];
  },

  // Optimize for production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    styledComponents: true,
  },

  // Images configuration
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
