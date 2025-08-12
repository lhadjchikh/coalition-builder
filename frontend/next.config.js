const path = require("path");

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
