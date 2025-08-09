// Jest configuration specifically for integration tests
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*integration*.test.{ts,tsx,js,jsx}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    // Handle module aliases (if you have them in your tsconfig)
    "^@/(.*)$": "<rootDir>/$1",
  },
};
