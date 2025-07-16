const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Handle module aliases (if you have them in your tsconfig)
    "^@/(.*)$": "<rootDir>/$1",
    "^@frontend/types$": "<rootDir>/frontend/src/types/index.ts",
    "^@frontend/(.*)$": "<rootDir>/frontend/src/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",

    // Explicitly map React modules to SSR's node_modules
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^react/jsx-runtime$": "<rootDir>/node_modules/react/jsx-runtime",

    // Map vanilla-cookieconsent to SSR's node_modules
    "^vanilla-cookieconsent$": "<rootDir>/node_modules/vanilla-cookieconsent",
    "^vanilla-cookieconsent/dist/cookieconsent.css$":
      "<rootDir>/__mocks__/styleMock.js",

    // Map testing libraries to SSR's node_modules
    "^@testing-library/react$": "<rootDir>/node_modules/@testing-library/react",
    "^@testing-library/jest-dom$":
      "<rootDir>/node_modules/@testing-library/jest-dom",

    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/app/**/*.test.{ts,tsx,js,jsx}",
    "<rootDir>/lib/**/*.test.{ts,tsx,js,jsx}",
    "<rootDir>/components/**/*.test.{ts,tsx,js,jsx}",
    "<rootDir>/__tests__/**/*.test.{ts,tsx,js,jsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/frontend/", // Ignore copied frontend tests - they're tested in frontend workflow
    "<rootDir>/shared/", // Ignore copied shared tests - they're tested in other workflows
    "<rootDir>/__tests__/integration/", // Integration tests use separate config
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!lib/**/*.d.ts",
    "!**/__tests__/**",
    "!**/node_modules/**",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
