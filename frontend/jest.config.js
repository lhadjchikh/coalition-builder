const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Handle module aliases (matching tsconfig.json)
    "^@/(.*)$": "<rootDir>/$1",
    "^@components/(.*)$": "<rootDir>/components/$1",
    "^@contexts/(.*)$": "<rootDir>/contexts/$1",
    "^@hooks/(.*)$": "<rootDir>/hooks/$1",
    "^@services/(.*)$": "<rootDir>/services/$1",
    "^@styles/(.*)$": "<rootDir>/styles/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@types/(.*)$": "<rootDir>/types/$1",
    "^@utils/(.*)$": "<rootDir>/utils/$1",

    // Map React modules to node_modules
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^react/jsx-runtime$": "<rootDir>/node_modules/react/jsx-runtime",

    // Map vanilla-cookieconsent to node_modules
    "^vanilla-cookieconsent$": "<rootDir>/node_modules/vanilla-cookieconsent",
    "^vanilla-cookieconsent/dist/cookieconsent.css$":
      "<rootDir>/__mocks__/styleMock.js",

    // Map testing libraries to node_modules
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
    "<rootDir>/services/**/*.test.{ts,tsx,js,jsx}",
    "<rootDir>/__tests__/**/*.test.{ts,tsx,js,jsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/integration/", // Integration tests use separate config
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "services/**/*.{js,jsx,ts,tsx}",
    "utils/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/__tests__/**",
    "!**/node_modules/**",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
