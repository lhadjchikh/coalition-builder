const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Webpack configuration
  webpack: (config) => {
    // Add path aliases that match tsconfig.json
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@components": path.resolve(__dirname, "components"),
      "@contexts": path.resolve(__dirname, "contexts"),
      "@hooks": path.resolve(__dirname, "hooks"),
      "@services": path.resolve(__dirname, "services"),
      "@styles": path.resolve(__dirname, "styles"),
      "@tests": path.resolve(__dirname, "tests"),
      "@types": path.resolve(__dirname, "types"),
      "@utils": path.resolve(__dirname, "utils"),
    };

    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      type: "asset/resource",
    });

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Environment variables - only pass through if explicitly set
  env: {
    // Only include NEXT_PUBLIC_API_URL if explicitly set (for CI/testing)
    // Production uses relative paths handled by rewrites
    ...(process.env.NEXT_PUBLIC_API_URL && {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    }),
  },

  // Rewrites for API calls - routes relative paths to backend
  // This handles both SSR server-side calls and client-side relative paths
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
    // For Next.js 12.3.0+, use remotePatterns for more flexible configuration
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      // Add your production domain here when deployed
      // {
      //   protocol: 'https',
      //   hostname: 'your-backend-domain.com',
      //   pathname: '/media/**',
      // },
    ],
    // Keep domains for backwards compatibility
    domains: ["localhost"],
    // Allow dynamic image sizing when dimensions are unknown
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
