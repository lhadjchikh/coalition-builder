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

    // Support both Docker (./frontend) and local (../frontend) paths
    const frontendPath = fs.existsSync(path.resolve(__dirname, "./frontend"))
      ? path.resolve(__dirname, "./frontend/src")
      : path.resolve(__dirname, "../frontend/src");

    config.resolve.alias = {
      ...config.resolve.alias,
      "@frontend": frontendPath,
      "@shared": sharedPath,
      // Add aliases for frontend imports
      "@services": path.join(frontendPath, "services"),
      "@app-types": path.join(frontendPath, "types"),
      "@styles": path.join(frontendPath, "styles"),
      "@components": path.join(frontendPath, "components"),
      "@contexts": path.join(frontendPath, "contexts"),
      "@hooks": path.join(frontendPath, "hooks"),
      "@pages": path.join(frontendPath, "pages"),
      "@tests": path.join(frontendPath, "tests"),
      "@utils": path.join(frontendPath, "utils"),
      // Ensure vanilla-cookieconsent resolves from SSR's node_modules
      "vanilla-cookieconsent": path.resolve(
        __dirname,
        "node_modules/vanilla-cookieconsent",
      ),
      // Ensure Font Awesome packages resolve from SSR's node_modules
      "@fortawesome/react-fontawesome": path.resolve(
        __dirname,
        "node_modules/@fortawesome/react-fontawesome",
      ),
      "@fortawesome/fontawesome-svg-core": path.resolve(
        __dirname,
        "node_modules/@fortawesome/fontawesome-svg-core",
      ),
      "@fortawesome/free-brands-svg-icons": path.resolve(
        __dirname,
        "node_modules/@fortawesome/free-brands-svg-icons",
      ),
      "@fortawesome/free-solid-svg-icons": path.resolve(
        __dirname,
        "node_modules/@fortawesome/free-solid-svg-icons",
      ),
    };

    // Exclude styled components and related files from compilation to avoid build errors
    // and ensure compatibility with server-side rendering (SSR). These files contain
    // styled-components that are not compatible with SSR compilation.
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        path.join(frontendPath, "components/styled"),
        path.join(frontendPath, "components/StyledHomePage.tsx"),
        path.join(frontendPath, "components/ThemeStyles.tsx"),
        path.join(frontendPath, "contexts/StyledThemeProvider.tsx"),
        path.join(frontendPath, "hooks/useStyledTheme.ts"),
        path.join(frontendPath, "styles/styled.d.ts"),
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
