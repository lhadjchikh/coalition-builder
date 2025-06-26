const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Webpack configuration to enable importing from frontend directory
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for importing from frontend
    config.resolve.alias = {
      ...config.resolve.alias,
      "@frontend": path.resolve(__dirname, "../frontend/src"),
    };

    // Allow importing TypeScript files from frontend
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [path.resolve(__dirname, "../frontend/src")],
      use: [
        {
          loader: "next/dist/compiled/babel/loader",
          options: {
            presets: ["next/babel"],
          },
        },
      ],
    });

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
  },

  // Images configuration
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
