// Resolve API URL once at config time — this value gets inlined into
// both client and server bundles via DefinePlugin, so server components
// don't need runtime env vars on Vercel.
const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";
const BROWSER_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;
const ADMIN_PAGE_URL = `${BROWSER_API_BASE_URL.replace(/\/+$/, "")}/admin/`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Preserve trailing slashes to match Django URL patterns
  trailingSlash: true,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "tsconfig.build.json",
  },

  // Inline API_URL into both client and server bundles via DefinePlugin.
  // Server components on Vercel don't have access to build-time env vars
  // at runtime, so we must embed the resolved URL as a constant.
  env: {
    API_URL: API_BASE_URL,
    NEXT_PUBLIC_API_URL: API_BASE_URL,
  },

  async redirects() {
    return [
      {
        source: "/admin",
        destination: ADMIN_PAGE_URL,
        permanent: false,
      },
    ];
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
        // :path* never includes a trailing slash (trailingSlash strips it),
        // so the explicit "/" here is safe and required by Django.
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
