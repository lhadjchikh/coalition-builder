/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Resolve API URL once at config time — this value gets inlined into
// both client and server bundles via DefinePlugin, so server components
// don't need runtime env vars on Vercel.
const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Preserve trailing slashes to match Django URL patterns
  trailingSlash: true,

  // Webpack configuration
  webpack: (config) => {
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

  // Inline API_URL into both client and server bundles via DefinePlugin.
  // Server components on Vercel don't have access to build-time env vars
  // at runtime, so we must embed the resolved URL as a constant.
  env: {
    API_URL: API_BASE_URL,
    NEXT_PUBLIC_API_URL: API_BASE_URL,
  },

  // Rewrites for API calls - routes relative paths to backend.
  // With trailingSlash: true, Next.js strips the trailing slash from :path*
  // before building the destination URL. Django requires trailing slashes
  // (APPEND_SLASH=True), so we must add one back to avoid an infinite
  // 301 redirect loop: Vercel proxy → Django 301 → Vercel proxy → …
  async rewrites() {
    return [
      {
        source: "/api",
        destination: `${API_BASE_URL}/api/`,
      },
      {
        source: "/api/",
        destination: `${API_BASE_URL}/api/`,
      },
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*/`,
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
    unoptimized: false,
    // For Next.js 12.3.0+, use remotePatterns for more flexible configuration
    remotePatterns: [
      // Only allow localhost in development
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              protocol: "http",
              hostname: "localhost",
              port: "8000",
              pathname: "/**",
            },
            {
              protocol: "https",
              hostname: "localhost",
              port: "8000",
              pathname: "/**",
            },
          ]
        : []),
      ...(process.env.CLOUDFRONT_DOMAIN
        ? [
            {
              protocol: "https",
              hostname: process.env.CLOUDFRONT_DOMAIN.replace(
                /^https?:\/\//,
                ""
              ),
              pathname: "/**",
            },
          ]
        : []),
      ...(process.env.BACKEND_DOMAIN &&
      process.env.BACKEND_DOMAIN !== process.env.CLOUDFRONT_DOMAIN
        ? [
            {
              protocol: "https",
              hostname: process.env.BACKEND_DOMAIN.replace(/^https?:\/\//, ""),
              pathname: "/**",
            },
          ]
        : []),
      // Allow S3 URLs for VPC endpoint access
      ...(process.env.AWS_STORAGE_BUCKET_NAME
        ? [
            {
              protocol: "https",
              hostname: `${process.env.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com`,
              pathname: "/**",
            },
          ]
        : []),
    ],
    // Enable image optimization in both development and production
    // This ensures consistent behavior and allows testing optimization during development
    unoptimized: false,
  },
};

module.exports = nextConfig;
