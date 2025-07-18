const path = require("path");
const fs = require("fs");

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
    const sharedPath = fs.existsSync(path.resolve(__dirname, "./shared"))
      ? path.resolve(__dirname, "./shared")
      : path.resolve(__dirname, "../shared");

    config.resolve.alias = {
      ...config.resolve.alias,
      "@frontend": path.resolve(__dirname, "./frontend/src"),
      "@shared": sharedPath,
      // Ensure vanilla-cookieconsent resolves from SSR's node_modules
      "vanilla-cookieconsent": path.resolve(
        __dirname,
        "node_modules/vanilla-cookieconsent",
      ),
    };

    // Exclude styled components and related files from compilation to avoid build errors
    // and ensure compatibility with server-side rendering (SSR). These files contain
    // styled-components that are not compatible with SSR compilation.
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        path.resolve(__dirname, "./frontend/src/components/styled"),
        path.resolve(__dirname, "./frontend/src/components/StyledHomePage.tsx"),
        path.resolve(__dirname, "./frontend/src/components/ThemeStyles.tsx"),
        path.resolve(
          __dirname,
          "./frontend/src/contexts/StyledThemeProvider.tsx",
        ),
        path.resolve(__dirname, "./frontend/src/hooks/useStyledTheme.ts"),
        path.resolve(__dirname, "./frontend/src/styles/styled.d.ts"),
      ],
      loader: "null-loader",
    });

    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      type: "asset/resource",
    });

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Allow importing from outside the root directory
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
  serverRuntimeConfig: {
    API_URL: process.env.API_URL || "http://localhost:8000",
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
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
